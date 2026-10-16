import type { FeeRule } from "./resolve-fee"

export interface RuleRow extends FeeRule {
  note?: string | null
  merchants?: { display_name: string } | null
}

export interface PlanRow {
  id: string
  name: string
  monthly_fee: number | string
  currency: string
  commission_percent: number | string | null
  active: boolean
}

export const SCOPE_LABEL: Record<string, string> = {
  merchant: "Merchant rules",
  category: "Category rules",
  service_line: "Service line rules",
  platform: "Platform default",
}
export const SCOPE_ORDER = ["merchant", "category", "service_line", "platform"] as const

/** Body for PUT /api/admin/fee-rules from an existing row (used by the active toggle). */
export function ruleToBody(r: RuleRow, patch: Partial<RuleRow> = {}) {
  const m = { ...r, ...patch }
  return {
    id: m.id, kind: m.kind, scope: m.scope, service_line: m.service_line, category: m.category, merchant_id: m.merchant_id,
    percent: m.percent, fixed_amount: m.fixed_amount, currency: m.currency, min_fee: m.min_fee, max_fee: m.max_fee,
    waive_above: m.waive_above, active: m.active, starts_at: m.starts_at, ends_at: m.ends_at, note: m.note ?? null,
  }
}
