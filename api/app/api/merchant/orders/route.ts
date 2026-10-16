import { merchantRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { check } from "@/lib/merchant/errors"
import { toSellerOrder } from "@/lib/merchant/orders"
import { rejectReasonOf } from "@/lib/merchant/home"

const STATE_FILTER: Record<string, string[]> = {
  new: ["awaiting_acceptance"],
  active: ["accepted", "in_progress"],
  done: ["fulfilled"],
  cancelled: ["cancelled"],
}

/** ?status=new|active|done|cancelled|all&limit=&offset= */
export const GET = merchantRoute("orders", async (req, { merchant }) => {
  const sp = new URL(req.url).searchParams
  const status = sp.get("status") || "all"
  let q = createServerClient()
    .from("marketplace_orders")
    .select("id,public_id,line,payment_state,fulfillment_state,fulfillment_mode,attention_due_at,exception_reason,digital_content,created_at,snapshot", { count: "exact" })
    .eq("merchant_id", merchant.id)
    .in("payment_state", ["paid", "refund_pending", "refunded"])
  if (STATE_FILTER[status]) q = q.in("fulfillment_state", STATE_FILTER[status])
  const limit = Math.min(Number(sp.get("limit")) || 30, 100)
  const offset = Math.max(Number(sp.get("offset")) || 0, 0)
  const { data, error, count } = await q.order("created_at", { ascending: false }).range(offset, offset + limit - 1)
  check(error)

  // counts per tab, for badges
  const countFor = async (states: string[]) => {
    const r = await createServerClient().from("marketplace_orders").select("id", { count: "exact", head: true }).eq("merchant_id", merchant.id).in("payment_state", ["paid", "refund_pending", "refunded"]).in("fulfillment_state", states)
    return r.count ?? 0
  }
  const [cNew, cActive] = await Promise.all([countFor(STATE_FILTER.new), countFor(STATE_FILTER.active)])
  const orders: any[] = (data || []).map(toSellerOrder)

  // A cancelled card names why. The reason lives in the audit row written when the seller rejected; omitted if unavailable.
  const cancelled = orders.filter((o) => o.status === "cancelled")
  if (cancelled.length) {
    try {
      const a = await createServerClient().from("audit_log").select("entity_id,details").eq("action", "order.reject").eq("merchant_id", merchant.id).in("entity_id", cancelled.map((o) => o.id))
      const byOrder = new Map<string, string | null>((a.data || []).map((r: any) => [String(r.entity_id), rejectReasonOf(r.details)]))
      for (const o of cancelled) o.rejectReason = byOrder.get(o.id) ?? null
    } catch (e) { console.error("orders list: reject reasons unavailable", e instanceof Error ? e.message : e) }
  }
  return { orders, total: count ?? 0, counts: { new: cNew, active: cActive } }
})
