import { createServerClient } from "@/lib/supabase"
import { MerchantError } from "@/lib/merchant/errors"

export const SUPPORT_TOPICS = ["order", "payment", "transfer", "account", "booking", "other"] as const
export type SupportTopic = (typeof SUPPORT_TOPICS)[number]

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const KNOWN: Record<string, number> = {
  SUPPORT_TOO_MANY_OPEN: 409,
  SUPPORT_ORDER_NOT_FOUND: 404,
  SUPPORT_NOT_FOUND: 404,
  SUPPORT_CLOSED: 409,
  SUPPORT_BAD_SENDER: 400,
}

/** Message text: trimmed, 1 to 4000 characters (counted in characters, not bytes). */
export function validateBody(raw: unknown): string {
  const text = typeof raw === "string" ? raw.trim() : ""
  if (!text) throw new MerchantError("MESSAGE_EMPTY", 400)
  if ([...text].length > 4000) throw new MerchantError("MESSAGE_TOO_LONG", 400)
  return text
}

export function validateNewRequest(input: any): { topic: SupportTopic; subject: string; orderId: string | null; body: string } {
  const topic = String(input?.topic || "")
  if (!(SUPPORT_TOPICS as readonly string[]).includes(topic)) throw new MerchantError("SUPPORT_TOPIC_INVALID", 400)
  const subject = typeof input?.subject === "string" ? input.subject.trim() : ""
  if ([...subject].length < 3 || [...subject].length > 120) throw new MerchantError("SUPPORT_SUBJECT_INVALID", 400)
  const orderId = input?.orderId ? String(input.orderId) : null
  if (orderId && !UUID.test(orderId)) throw new MerchantError("SUPPORT_ORDER_NOT_FOUND", 404)
  return { topic: topic as SupportTopic, subject, orderId, body: validateBody(input?.body) }
}

/** Turns a database exception from the support functions into a clean API error. */
export function mapSupportError(error: { message?: string } | null | undefined): never {
  const code = Object.keys(KNOWN).find((c) => String(error?.message || "").includes(c))
  if (code) throw new MerchantError(code, KNOWN[code])
  console.error("support db error", error?.message)
  throw new MerchantError("DATABASE_ERROR", 500)
}

const db = () => createServerClient()
const LIST = "id,public_id,topic,subject,status,order_id,customer_unread,last_message_at,last_message_preview,created_at"

export async function listForUser(userId: string, status?: string | null) {
  let q = db().from("support_requests").select(LIST).eq("user_id", userId)
  if (status === "open") q = q.neq("status", "resolved")
  if (status === "resolved") q = q.eq("status", "resolved")
  const { data, error } = await q.order("last_message_at", { ascending: false }).limit(100)
  if (error) mapSupportError(error)
  return data || []
}

export async function createRequest(userId: string, input: ReturnType<typeof validateNewRequest>) {
  const { data, error } = await db().rpc("support_create", { p_user: userId, p_topic: input.topic, p_subject: input.subject, p_order: input.orderId, p_body: input.body })
  if (error) mapSupportError(error)
  return String(data)
}

/** The customer's own request with its messages. Anything else looks like "not found". */
export async function threadForUser(userId: string, id: string) {
  if (!UUID.test(id)) throw new MerchantError("SUPPORT_NOT_FOUND", 404)
  const { data: request, error } = await db().from("support_requests").select(LIST).eq("id", id).eq("user_id", userId).maybeSingle()
  if (error) mapSupportError(error)
  if (!request) throw new MerchantError("SUPPORT_NOT_FOUND", 404)
  const { data: messages, error: mErr } = await db().from("support_messages").select("id,sender_kind,body,created_at").eq("request_id", id).order("id", { ascending: true }).limit(500)
  if (mErr) mapSupportError(mErr)
  return { request, messages: messages || [] }
}

export async function sendReply(kind: "customer" | "agent", requestId: string, senderId: string, body: string) {
  const { data, error } = await db().rpc("support_send", { p_request: requestId, p_kind: kind, p_sender: senderId, p_body: body })
  if (error) mapSupportError(error)
  return Number(data)
}

export async function markRead(requestId: string, reader: "customer" | "agent") {
  const { error } = await db().rpc("support_mark_read", { p_request: requestId, p_reader: reader })
  if (error) mapSupportError(error)
}

export async function unreadForUser(userId: string): Promise<number> {
  const { data, error } = await db().from("support_requests").select("customer_unread").eq("user_id", userId).gt("customer_unread", 0)
  if (error) mapSupportError(error)
  return (data || []).reduce((n, r: any) => n + Number(r.customer_unread || 0), 0)
}
