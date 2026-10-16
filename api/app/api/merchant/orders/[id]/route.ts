import { merchantRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { toSellerOrder, loadOwnedOrder } from "@/lib/merchant/orders"
import { rejectReasonOf } from "@/lib/merchant/home"

export const GET = merchantRoute("orders", async (_req, { merchant }, params) => {
  const order = await loadOwnedOrder(merchant.id, params.id)
  const { data: events, error } = await createServerClient().from("marketplace_events").select("id,kind,created_at,message,customer_visible").eq("order_id", order.id).order("created_at", { ascending: false })
  check(error)
  const sellerOrder: any = toSellerOrder(order)
  if (sellerOrder.status === "cancelled") {
    try {
      const a = await createServerClient().from("audit_log").select("details").eq("action", "order.reject").eq("merchant_id", merchant.id).eq("entity_id", order.id).order("created_at", { ascending: false }).limit(1)
      sellerOrder.rejectReason = rejectReasonOf(a.data?.[0]?.details)
    } catch (e) { console.error("order detail: reject reason unavailable", e instanceof Error ? e.message : e) }
  }
  return { order: sellerOrder, events: (events || []).filter((e: any) => e.customer_visible).map(({ customer_visible, ...e }: any) => e) }
})
