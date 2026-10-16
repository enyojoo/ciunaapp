import { adminRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { check } from "@/lib/merchant/errors"

/** Payout queue. ?status=requested|approved|paid|rejected|cancelled (default: open ones, oldest first). */
export const GET = adminRoute("finance.manage", async (req) => {
  const sp = new URL(req.url).searchParams
  const status = sp.get("status")
  let q = createServerClient().from("payouts").select("id,merchant_id,currency,amount,fee,net,status,reference,reason,method_snapshot,requested_at,decided_at,paid_at, merchants(display_name,country)", { count: "exact" })
  q = status ? q.eq("status", status) : q.in("status", ["requested", "approved"])
  const limit = Math.min(Number(sp.get("limit")) || 50, 200)
  const offset = Math.max(Number(sp.get("offset")) || 0, 0)
  const { data, error, count } = await q.order("requested_at", { ascending: !status || ["requested", "approved"].includes(status) }).range(offset, offset + limit - 1)
  check(error)
  return { payouts: data || [], total: count ?? 0 }
})
