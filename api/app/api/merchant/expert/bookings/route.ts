import { merchantRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { toSellerOrder } from "@/lib/merchant/orders"
import { bookingInScope, toBooking, type BookingScope } from "@/lib/merchant/expert"

export const GET = merchantRoute("orders", async (req, { merchant }) => {
  assert(merchant.type === "expert", "EXPERT_ONLY", 409)
  const sp = new URL(req.url).searchParams
  const scopeParam = sp.get("scope")
  assert(!scopeParam || ["upcoming", "past", "requests"].includes(scopeParam), "SCOPE_INVALID", 400)
  const scope = (scopeParam as BookingScope | null) || null
  const limit = Math.min(Math.max(Number(sp.get("limit")) || 50, 1), 200)
  const offset = Math.max(Number(sp.get("offset")) || 0, 0)

  let q = createServerClient().from("marketplace_orders").select("*").eq("merchant_id", merchant.id).eq("line", "experts").in("payment_state", ["paid", "refund_pending", "refunded"])
  if (scope === "requests") q = q.eq("fulfillment_state", "awaiting_acceptance")
  const { data, error } = await q.order("created_at", { ascending: false }).limit(500)
  check(error)
  const now = new Date()
  const all = (data || []).map(toSellerOrder).filter((o: any) => bookingInScope(o, scope, now))
  const startOf = (o: any) => (o.slot?.start ? new Date(o.slot.start).getTime() : 0)
  all.sort((a: any, b: any) => (scope === "upcoming" ? startOf(a) - startOf(b) : startOf(b) - startOf(a)))
  return { bookings: all.slice(offset, offset + limit).map(toBooking), total: all.length }
})
