import { createServerClient } from "@/lib/supabase"
import { safeSelect } from "@/lib/safe-select"
import { MerchantError, check } from "./errors"

/** Order chat. Rules live in SQL (message_send); these helpers validate early and shape responses. Never log bodies. */
export const MAX_BODY = 2000
export const PREVIEW_LENGTH = 120
export const CLOSE_AFTER_DAYS = 14
export const RATE_LIMIT_PER_HOUR = 30

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type SenderKind = "customer" | "merchant"
export interface ChatMessage { id: number; senderKind: SenderKind; body: string; language: string; createdAt: string; readAt: string | null }

/** Trims and validates a message body; throws MESSAGE_EMPTY / MESSAGE_TOO_LONG. */
export function cleanBody(raw: unknown): string {
  if (typeof raw !== "string") throw new MerchantError("MESSAGE_EMPTY", 400)
  const body = raw.trim()
  if (!body) throw new MerchantError("MESSAGE_EMPTY", 400)
  if ([...body].length > MAX_BODY) throw new MerchantError("MESSAGE_TOO_LONG", 400)
  return body
}

export function cleanLanguage(raw: unknown): string {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : ""
  return /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/.test(s) ? s : "en"
}

/** First 120 characters on one line, with an ellipsis when cut. */
export function preview(body: string, max = PREVIEW_LENGTH): string {
  const flat = body.replace(/\s+/g, " ").trim()
  const chars = [...flat]
  return chars.length > max ? chars.slice(0, max - 1).join("").trimEnd() + "…" : flat
}

/** Sellers see only the customer's first name. */
export function firstName(full: string | null | undefined): string | null {
  const first = (full || "").trim().split(/\s+/)[0]
  return first || null
}

/** Chat closes CLOSE_AFTER_DAYS after the order is fulfilled or cancelled (mirrors message_chat_state in SQL). */
export function chatClosed(order: { fulfillment_state: string; updated_at: string }, now = Date.now()): boolean {
  if (order.fulfillment_state !== "fulfilled" && order.fulfillment_state !== "cancelled") return false
  return new Date(order.updated_at).getTime() < now - CLOSE_AFTER_DAYS * 86_400_000
}

export function chatAvailable(order: { merchant_id: string | null; payment_state: string }): boolean {
  return Boolean(order.merchant_id) && ["paid", "refund_pending", "refunded"].includes(order.payment_state)
}

export function toChatMessage(r: any): ChatMessage {
  return { id: Number(r.id), senderKind: r.sender_kind, body: r.body, language: r.language, createdAt: r.created_at, readAt: r.read_by_other_at ?? null }
}

const KNOWN = ["CHAT_CLOSED", "RATE_LIMITED", "MESSAGE_EMPTY", "MESSAGE_TOO_LONG", "CHAT_UNAVAILABLE", "ORDER_NOT_FOUND", "FORBIDDEN"]
const STATUS: Record<string, number> = { CHAT_CLOSED: 409, CHAT_UNAVAILABLE: 409, RATE_LIMITED: 429, MESSAGE_EMPTY: 400, MESSAGE_TOO_LONG: 400, ORDER_NOT_FOUND: 404, FORBIDDEN: 403 }

/** Maps a database exception from message_send to an API error. */
export function sendError(error: { message: string; code?: string }): MerchantError {
  const code = KNOWN.find((c) => error.message.includes(c))
  if (code) return new MerchantError(code, STATUS[code])
  console.error("message send failed", error.code)
  return new MerchantError("DATABASE_ERROR", 500)
}

export async function sendMessage(orderId: string, kind: SenderKind, senderId: string, body: unknown, language?: unknown): Promise<ChatMessage> {
  const clean = cleanBody(body)
  const { data, error } = await createServerClient().rpc("message_send", { p_order: orderId, p_sender_kind: kind, p_sender: senderId, p_body: clean, p_lang: cleanLanguage(language) })
  if (error) throw sendError(error)
  return toChatMessage(Array.isArray(data) ? data[0] : data)
}

/** With `after` it returns what is newer (oldest first); without it, the latest 200 (oldest first). */
export async function listMessages(orderId: string, after: number): Promise<ChatMessage[]> {
  let q = createServerClient().from("order_messages").select("id,sender_kind,body,language,created_at,read_by_other_at").eq("order_id", orderId)
  q = after > 0 ? q.gt("id", after).order("id", { ascending: true }) : q.order("id", { ascending: false })
  const { data, error } = await q.limit(200)
  check(error)
  const rows = (data || []).map(toChatMessage)
  return after > 0 ? rows : rows.reverse()
}

export async function markRead(orderId: string, reader: SenderKind): Promise<number> {
  const { data, error } = await createServerClient().rpc("messages_mark_read", { p_order: orderId, p_reader_kind: reader })
  check(error)
  return Number(data) || 0
}

export function parseAfter(raw: string | null): number {
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : 0
}

/** Customer-side order lookup: only the owner's orders; id may be a uuid or public id. */
export async function loadCustomerOrder(userId: string, id: string) {
  const { data, error } = await safeSelect("marketplace_orders", "id,merchant_id,payment_state,fulfillment_state,updated_at", (cols) => {
    const q = createServerClient().from("marketplace_orders").select(cols).eq("user_id", userId)
    return (UUID.test(id) ? q.eq("id", id) : q.eq("public_id", id.toUpperCase())).maybeSingle()
  })
  check(error)
  if (!data) throw new MerchantError("ORDER_NOT_FOUND", 404)
  return { merchant_id: null, ...(data as any) } as { id: string; merchant_id: string | null; payment_state: string; fulfillment_state: string; updated_at: string }
}

export async function threadFor(order: { id: string; merchant_id: string | null; payment_state: string; fulfillment_state: string; updated_at: string }, after: number) {
  const available = chatAvailable(order)
  const messages = available ? await listMessages(order.id, after) : []
  return { messages, closed: !available || chatClosed(order), available }
}

/** Chat window for the customer order payload: whether it is open, closed, and when it closes or closed. */
export function chatState(
  order: { merchant_id: string | null; payment_state: string; fulfillment_state: string; updated_at: string },
  now = Date.now(),
) {
  const available = chatAvailable(order)
  const ends = order.fulfillment_state === "fulfilled" || order.fulfillment_state === "cancelled"
  const closesAt = ends ? new Date(new Date(order.updated_at).getTime() + CLOSE_AFTER_DAYS * 86_400_000).toISOString() : null
  return { available, closed: !available || chatClosed(order, now), closesAt }
}

const TABLE_PROBE_MS = 30_000
const probes = new Map<string, { at: number; ok: boolean }>()

/**
 * True when a table exists on this database. Lets customer routes show an empty/unavailable state instead of a 500
 * while a migration has not been applied yet. Cached briefly; any error other than "missing" counts as present.
 */
export async function tableExists(table: string, now = Date.now()): Promise<boolean> {
  const hit = probes.get(table)
  if (hit && now - hit.at < TABLE_PROBE_MS) return hit.ok
  const { error } = await createServerClient().from(table).select("*").limit(0)
  const missing = Boolean(error) && (error!.code === "PGRST205" || error!.code === "42P01" || /does not exist|schema cache/i.test(error!.message))
  probes.set(table, { at: now, ok: !missing })
  return !missing
}

/** Public seller identity for an order (store name or expert name). Null when it cannot be resolved; never throws. */
export async function sellerFor(order: { merchant_id: string | null }, line: string) {
  if (!order.merchant_id) return null
  try {
    const db = createServerClient()
    if (line === "experts") {
      const { data, error } = await db.from("expert_profiles").select("display_name,slug,image_url").eq("merchant_id", order.merchant_id).limit(1).maybeSingle()
      if (error || !data) return null
      return { name: data.display_name as string, slug: (data.slug as string) ?? null, line, photoUrl: (data.image_url as string) ?? null }
    }
    const { data, error } = await db.from("hub_vendors").select("name,slug,photo_url").eq("merchant_id", order.merchant_id).eq("service_line_slug", line).limit(1).maybeSingle()
    if (error || !data) return null
    return { name: data.name as string, slug: (data.slug as string) ?? null, line, photoUrl: (data.photo_url as string) ?? null }
  } catch {
    return null
  }
}
