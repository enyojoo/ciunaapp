import { createServerClient } from "@/lib/supabase"
import { assert, check, MerchantError } from "./errors"
import { resolveFee, type FeeRule, type FeePlan } from "./fees"

const db = () => createServerClient()

export async function loadFeeRules(kind: "commission" | "payout"): Promise<FeeRule[]> {
  const { data, error } = await db().from("fee_rules").select("*").eq("kind", kind).eq("active", true)
  check(error)
  return (data || []) as FeeRule[]
}

export async function loadPlan(merchantId: string): Promise<FeePlan | null> {
  const m = await db().from("merchants").select("fee_plan_id").eq("id", merchantId).maybeSingle()
  check(m.error)
  if (!m.data?.fee_plan_id) return null
  const p = await db().from("fee_plans").select("id,commission_percent").eq("id", m.data.fee_plan_id).eq("active", true).maybeSingle()
  check(p.error)
  return (p.data as FeePlan) ?? null
}

export async function setting<T>(key: string, fallback: T): Promise<T> {
  const { data } = await db().from("marketplace_settings").select("value").eq("key", key).maybeSingle()
  return (data?.value as T) ?? fallback
}

/** Commission for an order, from the rules in force now. Delivery fees are never commissioned. */
export async function commissionForOrder(order: any) {
  const snap = order.snapshot || {}
  const currency = snap.totals?.productCurrency || snap.totals?.payCurrency
  const subtotal = Number(snap.totals?.subtotal || 0)
  let category: string | null = null
  const productId = snap.lines?.[0]?.productId
  if (order.line !== "experts" && productId) {
    const p = await db().from("hub_products").select("category").eq("id", productId).maybeSingle()
    category = p.data?.category ?? null
  }
  const [rules, plan] = await Promise.all([loadFeeRules("commission"), loadPlan(order.merchant_id)])
  const result = resolveFee(rules, plan, { kind: "commission", merchantId: order.merchant_id, serviceLine: order.line, category, currency }, subtotal)
  return { ...result, currency, subtotal, category }
}

/** Freezes the commission at acceptance so rule edits never change an accepted order. Idempotent. */
export async function snapshotOrderFee(orderId: string): Promise<void> {
  try {
    const { data: order, error } = await db().from("marketplace_orders").select("id,line,merchant_id,snapshot").eq("id", orderId).maybeSingle()
    check(error)
    if (!order?.merchant_id) return
    const c = await commissionForOrder(order)
    await db().from("order_fees").upsert(
      { order_id: orderId, merchant_id: order.merchant_id, currency: c.currency, subtotal: c.subtotal, commission: c.fee, snapshot: { source: c.source, ruleId: c.ruleId, percent: c.percent, fixed: c.fixed, category: c.category, currency: c.currency, subtotal: c.subtotal, at: new Date().toISOString() } },
      { onConflict: "order_id", ignoreDuplicates: true },
    )
  } catch (e) {
    console.error("ORDER_FEE_SNAPSHOT_FAILED", orderId, e instanceof Error ? e.message : e)
  }
}

/**
 * Records the earning for a fulfilled order (idempotent). Called after seller or Office fulfilment and by the
 * cron backfill. Never throws to the caller: the order is already fulfilled, so a failure is logged and retried by cron.
 */
export async function recordEarningForOrder(orderId: string): Promise<boolean> {
  try {
    const { data: order, error } = await db().from("marketplace_orders").select("id,line,merchant_id,fulfillment_state,snapshot").eq("id", orderId).maybeSingle()
    check(error)
    if (!order || !order.merchant_id || order.fulfillment_state !== "fulfilled") return false
    const existing = await db().from("order_fees").select("commission,snapshot").eq("order_id", orderId).maybeSingle()
    const fee = existing.data ? { fee: Number(existing.data.commission), snapshot: existing.data.snapshot } : await (async () => {
      const c = await commissionForOrder(order)
      return { fee: c.fee, snapshot: { source: c.source, ruleId: c.ruleId, percent: c.percent, fixed: c.fixed, category: c.category, currency: c.currency, subtotal: c.subtotal, at: new Date().toISOString() } }
    })()
    const hold = Number(await setting("payout_hold_days", 2))
    const { error: rpcErr } = await db().rpc("earning_record", { p_order: orderId, p_commission: fee.fee, p_snapshot: fee.snapshot, p_hold_days: hold })
    check(rpcErr)
    return true
  } catch (e) {
    console.error("EARNING_RECORD_FAILED", orderId, e instanceof Error ? e.message : e)
    return false
  }
}

export async function runMoneyJobs() {
  const released = await db().rpc("earnings_release_due")
  check(released.error)
  const { data: pending, error } = await db()
    .from("marketplace_orders")
    .select("id, merchant_earnings(id)")
    .eq("fulfillment_state", "fulfilled")
    .not("merchant_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(200)
  check(error)
  const missing = (pending || []).filter((o: any) => !o.merchant_earnings || (Array.isArray(o.merchant_earnings) && o.merchant_earnings.length === 0))
  let recorded = 0
  for (const o of missing) if (await recordEarningForOrder(o.id)) recorded++
  return { released: released.data as number, recorded, scanned: pending?.length ?? 0 }
}

export interface Balance { currency: string; pending: number; available: number; inPayout: number; paidOut: number; lifetimeNet: number }

export async function merchantBalances(merchantId: string): Promise<Balance[]> {
  const [bal, paid, earned] = await Promise.all([
    db().from("ledger_balances").select("kind,currency,balance").eq("merchant_id", merchantId),
    db().from("payouts").select("currency,amount").eq("merchant_id", merchantId).eq("status", "paid"),
    db().from("merchant_earnings").select("currency,net").eq("merchant_id", merchantId).neq("status", "reversed"),
  ])
  check(bal.error); check(paid.error); check(earned.error)
  const by = new Map<string, Balance>()
  const get = (c: string) => by.get(c) ?? (by.set(c, { currency: c, pending: 0, available: 0, inPayout: 0, paidOut: 0, lifetimeNet: 0 }), by.get(c)!)
  for (const r of bal.data || []) {
    const b = get(r.currency)
    const v = Number(r.balance)
    if (r.kind === "merchant_pending") b.pending = v
    else if (r.kind === "merchant_available") b.available = v
    else if (r.kind === "merchant_payout_hold") b.inPayout = v
  }
  for (const r of paid.data || []) get(r.currency).paidOut += Number(r.amount)
  for (const r of earned.data || []) get(r.currency).lifetimeNet += Number(r.net)
  return Array.from(by.values())
}

/** Translate database exception text from the money functions into stable API codes. */
export function moneyError(e: { message?: string } | null): never {
  const m = String(e?.message || "")
  const codes = ["INSUFFICIENT_BALANCE", "BELOW_MINIMUM_PAYOUT", "PAYOUT_METHOD_NOT_FOUND", "PAYOUT_METHOD_NOT_VERIFIED", "PAYOUT_CURRENCY_MISMATCH", "AMOUNT_INVALID", "TOO_MANY_OPEN_PAYOUTS", "PAYOUT_FEE_INVALID", "INVALID_TRANSITION", "REFERENCE_REQUIRED", "REASON_REQUIRED", "PAYOUT_NOT_FOUND", "INVALID_ACTION"]
  const hit = codes.find((c) => m.includes(c))
  if (hit) throw new MerchantError(hit, hit === "PAYOUT_NOT_FOUND" ? 404 : 409)
  console.error("money rpc failed", m)
  throw new MerchantError("UNAVAILABLE", 503)
}
export { assert }
