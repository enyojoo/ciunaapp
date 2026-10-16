import { merchantRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { toSellerOrder, loadOwnedOrder } from "@/lib/merchant/orders"

export const GET = merchantRoute("orders", async (_req, { merchant }, params) => {
  const order = await loadOwnedOrder(merchant.id, params.id)
  const { data: events, error } = await createServerClient().from("marketplace_events").select("id,kind,created_at,message,customer_visible").eq("order_id", order.id).order("created_at", { ascending: false })
  check(error)
  return { order: toSellerOrder(order), events: (events || []).filter((e: any) => e.customer_visible).map(({ customer_visible, ...e }: any) => e) }
})
