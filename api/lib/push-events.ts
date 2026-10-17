import { createServerClient } from "@/lib/supabase"
import { tEmail } from "@/lib/i18n/server"
import { sendPushToUser } from "@/lib/push"

/** Tell the customer that support replied, in their language. Never throws. */
export async function notifySupportReply(requestId: string): Promise<void> {
  try {
    const db = createServerClient()
    const { data: req } = await db.from("support_requests").select("user_id,subject,public_id").eq("id", requestId).maybeSingle()
    if (!req) return
    const { data: user } = await db.from("users").select("preferred_language").eq("id", (req as any).user_id).maybeSingle()
    const lng = (user as any)?.preferred_language
    await sendPushToUser((req as any).user_id, {
      title: tEmail("push.supportReply.title", {}, lng),
      body: tEmail("push.supportReply.body", { subject: (req as any).subject }, lng),
      data: { type: "support", requestId },
    }, "support")
  } catch (e) {
    console.error("support push failed", (e as Error)?.message)
  }
}

/** Order event kinds the customer is told about, and the age after which a late event is not worth a notification. */
export const ORDER_PUSH_KINDS = ["paid", "accept", "start", "fulfill", "cancel", "refund"] as const
export const ORDER_PUSH_MAX_AGE_MS = 6 * 3600_000

export function orderPushWanted(kind: string, createdAt: string, now = Date.now()): boolean {
  return (ORDER_PUSH_KINDS as readonly string[]).includes(kind) && now - new Date(createdAt).getTime() <= ORDER_PUSH_MAX_AGE_MS
}

/** Claims every order event not yet processed, then notifies the customer for the ones that matter. Safe to run often. */
export async function sendOrderNotifications(): Promise<{ claimed: number; sent: number }> {
  const db = createServerClient()
  const { data, error } = await db.from("marketplace_events").update({ notified_at: new Date().toISOString() }).is("notified_at", null).eq("customer_visible", true).select("id,order_id,kind,created_at").limit(200)
  if (error) throw new Error(error.message)
  const events = ((data as any[]) || []).filter((e) => orderPushWanted(e.kind, e.created_at))
  let sent = 0
  for (const ev of events) {
    try {
      const { data: order } = await db.from("marketplace_orders").select("user_id,public_id").eq("id", ev.order_id).maybeSingle()
      if (!order) continue
      const { data: user } = await db.from("users").select("preferred_language").eq("id", (order as any).user_id).maybeSingle()
      const lng = (user as any)?.preferred_language
      const vars = { id: (order as any).public_id }
      sent += await sendPushToUser((order as any).user_id, {
        title: tEmail(`push.order.${ev.kind}.title`, vars, lng),
        body: tEmail(`push.order.${ev.kind}.body`, vars, lng),
        data: { type: "order", orderId: ev.order_id },
      }, "orders")
    } catch (e) {
      console.error("order push failed", (e as Error)?.message)
    }
  }
  return { claimed: ((data as any[]) || []).length, sent }
}

/** The seller wrote to the customer. Never throws. */
export async function notifyChatMessage(orderId: string, text: string): Promise<void> {
  try {
    const db = createServerClient()
    const { data: order } = await db.from("marketplace_orders").select("user_id").eq("id", orderId).maybeSingle()
    if (!order) return
    const { data: user } = await db.from("users").select("preferred_language").eq("id", (order as any).user_id).maybeSingle()
    await sendPushToUser((order as any).user_id, {
      title: tEmail("push.chat.title", {}, (user as any)?.preferred_language),
      body: text,
      data: { type: "chat", orderId },
    }, "messages")
  } catch (e) {
    console.error("chat push failed", (e as Error)?.message)
  }
}

/** Transfer statuses the customer is told about, and how recent an event must be. */
export const TRANSFER_PUSH_STATUSES = ["processing", "completed", "deposited", "failed", "refunded"] as const
const TRANSFER_KEY: Record<string, string> = { processing: "processing", completed: "completed", deposited: "completed", failed: "failed", refunded: "refunded" }

export function transferPushWanted(status: string, createdAt: string, now = Date.now()): boolean {
  return (TRANSFER_PUSH_STATUSES as readonly string[]).includes(status) && now - new Date(createdAt).getTime() <= ORDER_PUSH_MAX_AGE_MS
}

/** Claims unprocessed transfer events and notifies the customer: payment received, delivered, failed, refunded (at most four per transfer). */
export async function sendTransferNotifications(): Promise<{ claimed: number; sent: number }> {
  const db = createServerClient()
  const { data, error } = await db.from("transfer_events").update({ notified_at: new Date().toISOString() }).is("notified_at", null).select("id,transaction_id,user_id,status,created_at").limit(200)
  if (error) {
    // The table exists only after transfer-events.sql has run; before that there is nothing to send.
    if (error.code === "42P01" || error.code === "PGRST205") return { claimed: 0, sent: 0 }
    throw new Error(error.message)
  }
  const events = ((data as any[]) || []).filter((e) => transferPushWanted(e.status, e.created_at))
  let sent = 0
  for (const ev of events) {
    try {
      const { data: tx } = await db.from("transactions").select("transaction_id,transaction_source,send_amount,send_currency,receive_amount,receive_currency,recipient_id").eq("id", ev.transaction_id).maybeSingle()
      if (!tx || (tx as any).transaction_source === "hub") continue
      const { data: rec } = (tx as any).recipient_id ? await db.from("recipients").select("full_name").eq("id", (tx as any).recipient_id).maybeSingle() : { data: null }
      const { data: user } = await db.from("users").select("preferred_language").eq("id", ev.user_id).maybeSingle()
      const lng = (user as any)?.preferred_language
      const key = TRANSFER_KEY[ev.status]
      const money = (n: unknown, c: unknown) => `${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} ${String(c || "")}`.trim()
      const vars = { id: (tx as any).transaction_id, name: (rec as any)?.full_name || "", to: (rec as any)?.full_name ? ` → ${(rec as any).full_name}` : "", sent: money((tx as any).send_amount, (tx as any).send_currency), received: money((tx as any).receive_amount, (tx as any).receive_currency) }
      sent += await sendPushToUser(ev.user_id, {
        title: tEmail(`push.transfer.${key}.title`, vars, lng),
        body: tEmail(`push.transfer.${key}.body`, vars, lng),
        data: { type: "transfer", transactionId: (tx as any).transaction_id },
      }, "transfers")
    } catch (e) {
      console.error("transfer push failed", (e as Error)?.message)
    }
  }
  return { claimed: ((data as any[]) || []).length, sent }
}

export const BOOKING_REMINDER_LEAD_MS = 60 * 60_000
export const BOOKING_REMINDER_WINDOW_MS = 75 * 60_000

/** Bookings starting within the next 75 minutes are due a reminder (the job runs every minute, so each is caught well before it starts). */
export function reminderWindow(now = Date.now()): { from: string; to: string } {
  return { from: new Date(now).toISOString(), to: new Date(now + BOOKING_REMINDER_WINDOW_MS).toISOString() }
}

/** One reminder per confirmed booking, about an hour before it starts. Safe to run every minute. */
export async function sendBookingReminders(): Promise<{ claimed: number; sent: number }> {
  const db = createServerClient()
  const { from, to } = reminderWindow()
  const { data, error } = await db.from("expert_bookings").update({ reminder_sent_at: new Date().toISOString() }).eq("status", "confirmed").is("reminder_sent_at", null).gt("slot_start", from).lte("slot_start", to).select("user_id,expert_profile_id,transaction_id,slot_start").limit(100)
  if (error) {
    if (error.code === "42703" || error.code === "42P01" || error.code === "PGRST204") return { claimed: 0, sent: 0 }
    throw new Error(error.message)
  }
  let sent = 0
  for (const b of (data as any[]) || []) {
    try {
      const [{ data: order }, { data: expert }, { data: user }] = await Promise.all([
        db.from("marketplace_orders").select("id,public_id").eq("public_id", b.transaction_id).maybeSingle(),
        db.from("expert_profiles").select("display_name").eq("id", b.expert_profile_id).maybeSingle(),
        db.from("users").select("preferred_language").eq("id", b.user_id).maybeSingle(),
      ])
      if (!order) continue
      const lng = (user as any)?.preferred_language
      const vars = { name: (expert as any)?.display_name || "", id: (order as any).public_id }
      sent += await sendPushToUser(b.user_id, {
        title: tEmail("push.booking.reminder.title", vars, lng),
        body: tEmail("push.booking.reminder.body", vars, lng),
        data: { type: "order", orderId: (order as any).id },
      }, "orders")
    } catch (e) {
      console.error("booking reminder failed", (e as Error)?.message)
    }
  }
  return { claimed: ((data as any[]) || []).length, sent }
}
