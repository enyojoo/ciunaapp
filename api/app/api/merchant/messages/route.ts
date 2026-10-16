import { merchantRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { check } from "@/lib/merchant/errors"
import { firstName, preview } from "@/lib/merchant/messages"
import { sellerStatus } from "@/lib/merchant/orders"

export const GET = merchantRoute("messages", async (_req, { merchant }) => {
  const { data, error } = await createServerClient().rpc("messages_threads", { p_merchant: merchant.id, p_limit: 100 })
  check(error)
  const threads = (data || []).map((r: any) => ({
    orderId: r.order_id,
    publicId: r.public_id,
    customerName: firstName(r.contact_name),
    lastMessage: preview(r.last_body || ""),
    lastFrom: r.last_sender_kind,
    lastAt: r.last_at,
    unread: Number(r.unread) || 0,
    status: sellerStatus({ fulfillment_state: r.fulfillment_state, payment_state: "paid" }),
    closed: r.chat_state !== "open",
  }))
  return { threads, unread: threads.reduce((n: number, t: { unread: number }) => n + t.unread, 0) }
})
