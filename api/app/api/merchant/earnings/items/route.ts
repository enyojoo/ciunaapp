import { merchantRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { check } from "@/lib/merchant/errors"
import { feeRuleOf, reversalReasonOf } from "@/lib/merchant/home"

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
  const items: any[] = data || []

  // Extra fields are best effort: if order_fees or the ledger is unavailable the rows still return, without them.
  const rules = new Map<string, unknown>()
  const memos = new Map<string, string | null>()
  if (items.length) {
    try {
      const fees = await createServerClient().from("order_fees").select("order_id,snapshot").in("order_id", items.map((i) => i.order_id))
      for (const f of fees.data || []) rules.set(f.order_id, f.snapshot)
    } catch (e) { console.error("earnings items: fee rules unavailable", e instanceof Error ? e.message : e) }
    const reversed = items.filter((i) => i.status === "reversed")
    if (reversed.length) {
      try {
        const tx = await createServerClient().from("ledger_txns").select("key,memo").in("key", reversed.map((i) => `reverse:${i.id}`))
        for (const t of tx.data || []) memos.set(String(t.key).slice("reverse:".length), t.memo)
      } catch (e) { console.error("earnings items: reversal memo unavailable", e instanceof Error ? e.message : e) }
    }
  }
  return {
    items: items.map((i) => ({
      ...i,
      fee_rule: feeRuleOf(rules.get(i.order_id), i.marketplace_orders?.line),
      ...(i.status === "reversed" ? { reversed_reason: reversalReasonOf(memos.get(i.id)) } : {}),
    })),
    total: count ?? 0,
  }
})
