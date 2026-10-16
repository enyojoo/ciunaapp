import { merchantRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { check } from "@/lib/merchant/errors"

/** Per-order statement lines: gross, Ciuna fee, net. ?status=pending|available|reversed&limit&offset */
export const GET = merchantRoute("earnings", async (req, { merchant }) => {
  const sp = new URL(req.url).searchParams
  let q = createServerClient().from("merchant_earnings").select("id,order_id,currency,subtotal,delivery_fee,commission,net,status,fulfilled_at,release_at,released_at, marketplace_orders(public_id,line)", { count: "exact" }).eq("merchant_id", merchant.id)
  const status = sp.get("status")
  if (status && ["pending", "available", "reversed"].includes(status)) q = q.eq("status", status)
  const limit = Math.min(Number(sp.get("limit")) || 30, 100)
  const offset = Math.max(Number(sp.get("offset")) || 0, 0)
  const { data, error, count } = await q.order("fulfilled_at", { ascending: false }).range(offset, offset + limit - 1)
  check(error)
  return { items: data || [], total: count ?? 0 }
})
