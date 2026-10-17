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
