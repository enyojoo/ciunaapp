import { adminRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { check } from "@/lib/merchant/errors"
import { merchantBalances } from "@/lib/merchant/money"

export const GET = adminRoute("finance.manage", async (_req, _admin, params) => {
  const db = createServerClient()
  const [balances, earnings, payouts, methods] = await Promise.all([
    merchantBalances(params.id),
    db.from("merchant_earnings").select("id,order_id,currency,subtotal,delivery_fee,commission,net,status,fulfilled_at,release_at, marketplace_orders(public_id)").eq("merchant_id", params.id).order("fulfilled_at", { ascending: false }).limit(100),
    db.from("payouts").select("id,currency,amount,fee,net,status,requested_at,paid_at,reference").eq("merchant_id", params.id).order("requested_at", { ascending: false }).limit(50),
    db.from("merchant_payout_methods").select("id,kind,currency,label,last4,verified,is_default").eq("merchant_id", params.id),
  ])
  check(earnings.error); check(payouts.error); check(methods.error)
  return { balances, earnings: earnings.data || [], payouts: payouts.data || [], methods: methods.data || [] }
})
