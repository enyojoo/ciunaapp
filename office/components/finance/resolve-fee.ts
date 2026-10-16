// Client-side mirror of api/lib/merchant/fees.ts. Keep the two identical; resolve-fee.test.ts carries the same cases as api/tests/merchant/fees.test.ts.
/**
 * Fee engine. Pure functions: rules in, a fee and the rule that produced it out.
 * Resolution order (most specific wins): merchant rule > merchant's fee plan > category > service line > platform.
 * Ties go to the newest rule. A fixed amount in another currency is ignored; the percent part still applies.
 */
export interface FeeRule {
  id: string
  kind: "commission" | "payout"
  scope: "platform" | "service_line" | "category" | "merchant"
  service_line: string | null
  category: string | null
  merchant_id: string | null
  percent: number | string | null
  fixed_amount: number | string | null
  currency: string | null
  min_fee: number | string | null
  max_fee: number | string | null
  waive_above: number | string | null
  active: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
}

export interface FeePlan { id: string; commission_percent: number | string | null }

export interface FeeContext {
  kind: "commission" | "payout"
  merchantId: string
  serviceLine?: string | null
  category?: string | null
  currency: string
  at?: Date
}

export interface FeeResult {
  fee: number
  source: "merchant" | "plan" | "category" | "service_line" | "platform" | "none"
  ruleId: string | null
  percent: number | null
  fixed: number | null
}

const num = (v: unknown): number | null => (v === null || v === undefined || v === "" ? null : Number(v))
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export function ruleApplies(r: FeeRule, ctx: FeeContext): boolean {
  if (!r.active || r.kind !== ctx.kind) return false
  const at = (ctx.at ?? new Date()).getTime()
  if (r.starts_at && new Date(r.starts_at).getTime() > at) return false
  if (r.ends_at && new Date(r.ends_at).getTime() <= at) return false
  switch (r.scope) {
    case "merchant":
      return r.merchant_id === ctx.merchantId
    case "category":
      return Boolean(r.service_line && r.service_line === ctx.serviceLine && r.category && r.category === ctx.category)
    case "service_line":
      return Boolean(r.service_line && r.service_line === ctx.serviceLine)
    case "platform":
      return true
  }
}

const RANK: Record<FeeRule["scope"], number> = { merchant: 5, category: 3, service_line: 2, platform: 1 }

export function computeFee(rule: Pick<FeeRule, "percent" | "fixed_amount" | "currency" | "min_fee" | "max_fee" | "waive_above">, amount: number, currency: string): number {
  const waive = num(rule.waive_above)
  if (waive !== null && amount >= waive) return 0
  const sameCurrency = !rule.currency || rule.currency === currency
  let fee = 0
  const pct = num(rule.percent)
  if (pct !== null) fee += (amount * pct) / 100
  const fixed = num(rule.fixed_amount)
  if (fixed !== null && sameCurrency) fee += fixed
  if (sameCurrency) {
    const min = num(rule.min_fee)
    const max = num(rule.max_fee)
    if (min !== null && fee < min) fee = min
    if (max !== null && fee > max) fee = max
  }
  return round2(Math.min(Math.max(fee, 0), amount))
}

export function resolveFee(rules: FeeRule[], plan: FeePlan | null, ctx: FeeContext, amount: number): FeeResult {
  const candidates = rules
    .filter((r) => ruleApplies(r, ctx))
    // a fixed-only rule in another currency cannot apply
    .filter((r) => num(r.percent) !== null || !r.currency || r.currency === ctx.currency)
    .map((r) => ({ rule: r, rank: RANK[r.scope] }))
  const planPercent = ctx.kind === "commission" ? num(plan?.commission_percent) : null
  if (planPercent !== null) candidates.push({ rule: { id: `plan:${plan!.id}`, kind: "commission", scope: "platform", service_line: null, category: null, merchant_id: null, percent: planPercent, fixed_amount: null, currency: null, min_fee: null, max_fee: null, waive_above: null, active: true, starts_at: null, ends_at: null, created_at: "1970-01-01" }, rank: 4 })
  if (!candidates.length) return { fee: 0, source: "none", ruleId: null, percent: null, fixed: null }
  candidates.sort((a, b) => b.rank - a.rank || (a.rule.created_at < b.rule.created_at ? 1 : -1))
  const best = candidates[0]
  const source = best.rank === 4 ? "plan" : best.rule.scope
  return {
    fee: computeFee(best.rule, amount, ctx.currency),
    source,
    ruleId: best.rule.id.startsWith("plan:") ? null : best.rule.id,
    percent: num(best.rule.percent),
    fixed: num(best.rule.fixed_amount),
  }
}
