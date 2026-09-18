import { createServerClient } from "@/lib/supabase"

export type ReferralProgramMode = "threshold" | "percent" | "tier"

export const PERCENT_REWARD_DURATION_MONTHS = [3, 6, 8, 12] as const
export type PercentRewardDurationMonths = (typeof PERCENT_REWARD_DURATION_MONTHS)[number]

export interface ReferralPercentTier {
  min_qualified_referees_in_quarter: number
  /** Decimal fraction, e.g. 0.005 = 0.5% */
  percent_of_send: number
}

export interface ReferralProgramSettings {
  program_active: boolean
  mode: ReferralProgramMode
  policy_currency: string
  reward_amount: number
  threshold_send_amount: number
  /** Decimal fraction; used when mode is percent (flat rate). */
  percent_of_send: number
  /** Calendar months for percent/tier window from first qualifying completed send (per referee). */
  percent_reward_duration_months: PercentRewardDurationMonths
  /** When mode is tier: tiers sorted by min ascending after parse. */
  percent_tiers: ReferralPercentTier[]
}

const DEFAULT_SETTINGS: ReferralProgramSettings = {
  program_active: true,
  mode: "threshold",
  policy_currency: "USD",
  reward_amount: 5,
  threshold_send_amount: 500,
  percent_of_send: 0.005,
  percent_reward_duration_months: 6,
  percent_tiers: [{ min_qualified_referees_in_quarter: 5, percent_of_send: 0.005 }],
}

function clampDurationMonths(n: number): PercentRewardDurationMonths {
  const allowed = PERCENT_REWARD_DURATION_MONTHS as readonly number[]
  if (allowed.includes(n)) return n as PercentRewardDurationMonths
  return DEFAULT_SETTINGS.percent_reward_duration_months
}

function parseMode(raw: unknown): ReferralProgramMode {
  if (raw === "tier") return "tier"
  if (raw === "percent") return "percent"
  return "threshold"
}

export function normalizePercentTiers(raw: unknown, fallbackPercent: number): ReferralPercentTier[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [{ min_qualified_referees_in_quarter: 5, percent_of_send: fallbackPercent }]
  }
  const rows: ReferralPercentTier[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const o = item as Record<string, unknown>
    const min = Number(o.min_qualified_referees_in_quarter ?? o.min ?? 0)
    const pct = Number(o.percent_of_send ?? o.percent ?? fallbackPercent)
    if (!Number.isFinite(min) || !Number.isFinite(pct)) continue
    rows.push({
      min_qualified_referees_in_quarter: Math.max(0, Math.floor(min)),
      percent_of_send: pct,
    })
  }
  if (rows.length === 0) {
    return [{ min_qualified_referees_in_quarter: 5, percent_of_send: fallbackPercent }]
  }
  rows.sort((a, b) => a.min_qualified_referees_in_quarter - b.min_qualified_referees_in_quarter)
  const dedup: ReferralPercentTier[] = []
  for (const r of rows) {
    const last = dedup[dedup.length - 1]
    if (last && last.min_qualified_referees_in_quarter === r.min_qualified_referees_in_quarter) {
      dedup[dedup.length - 1] = r
    } else {
      dedup.push(r)
    }
  }
  return dedup
}

function sortedTiers(tiers: ReferralPercentTier[]): ReferralPercentTier[] {
  return [...tiers].sort((a, b) => a.min_qualified_referees_in_quarter - b.min_qualified_referees_in_quarter)
}

/**
 * Tier numbers act as inclusive upper bounds:
 * 5 => 1-5 qualified referees, 10 => 6-10, etc.
 * Legacy leading 0 is preserved as an immediate first tier that runs until the next bound.
 */
export function resolveTierUpperBound(tiers: ReferralPercentTier[], index: number): number {
  const sorted = sortedTiers(tiers)
  if (index < 0 || index >= sorted.length) return Infinity
  if (sorted.length === 1) return Infinity
  if (sorted[0].min_qualified_referees_in_quarter <= 0) {
    return index < sorted.length - 1
      ? sorted[index + 1].min_qualified_referees_in_quarter
      : Infinity
  }
  return index < sorted.length - 1 ? sorted[index].min_qualified_referees_in_quarter : Infinity
}

/** Commission percent by qualified referee count using tier ranges instead of minimum thresholds. */
export function resolveTierPercent(tiers: ReferralPercentTier[], qualifiedCount: number): number {
  if (qualifiedCount <= 0) return 0
  const sorted = sortedTiers(tiers)
  for (let i = 0; i < sorted.length; i++) {
    if (qualifiedCount <= resolveTierUpperBound(sorted, i)) {
      return sorted[i].percent_of_send
    }
  }
  return sorted[sorted.length - 1]?.percent_of_send ?? 0
}

/** Index into the active tier range for the current qualified-referee count. */
export function resolveTierIndex(tiers: ReferralPercentTier[], qualifiedCount: number): number {
  const sorted = sortedTiers(tiers)
  if (sorted.length === 0) return 0
  if (qualifiedCount <= 0) return 0
  for (let i = 0; i < sorted.length; i++) {
    if (qualifiedCount <= resolveTierUpperBound(sorted, i)) {
      return i
    }
  }
  return sorted.length - 1
}

/** UTC calendar quarter containing `date` (inclusive start, inclusive end). */
export function getUtcQuarterBoundsForDate(date: Date): { start: Date; end: Date } {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth()
  const qStartMonth = Math.floor(m / 3) * 3
  const start = new Date(Date.UTC(y, qStartMonth, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(y, qStartMonth + 3, 0, 23, 59, 59, 999))
  return { start, end }
}

export function formatUtcQuarterLabel(date: Date): string {
  const q = Math.floor(date.getUTCMonth() / 3) + 1
  return `Q${q} ${date.getUTCFullYear()}`
}

function parseSettings(raw: unknown): ReferralProgramSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_SETTINGS
  const o = raw as Record<string, unknown>
  const fallbackPct = Number(o.percent_of_send ?? DEFAULT_SETTINGS.percent_of_send)
  const percent_of_send = Number.isFinite(fallbackPct) ? fallbackPct : DEFAULT_SETTINGS.percent_of_send
  const mode = parseMode(o.mode)
  const percent_tiers = normalizePercentTiers(o.percent_tiers, percent_of_send)
  return {
    program_active: Boolean(o.program_active ?? DEFAULT_SETTINGS.program_active),
    mode,
    policy_currency: typeof o.policy_currency === "string" ? o.policy_currency : DEFAULT_SETTINGS.policy_currency,
    reward_amount: Number(o.reward_amount ?? DEFAULT_SETTINGS.reward_amount),
    threshold_send_amount: Number(o.threshold_send_amount ?? DEFAULT_SETTINGS.threshold_send_amount),
    percent_of_send,
    percent_reward_duration_months: clampDurationMonths(
      Number(o.percent_reward_duration_months ?? DEFAULT_SETTINGS.percent_reward_duration_months),
    ),
    percent_tiers,
  }
}

/** Server-side (service role): program rules */
export async function getReferralProgramSettingsServer(): Promise<ReferralProgramSettings> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("system_settings").select("value, data_type").eq("key", "referral_program").maybeSingle()
    if (error || data?.value == null) return DEFAULT_SETTINGS
    let raw: unknown = data.value
    if (typeof raw === "string") {
      try {
        raw = JSON.parse(raw)
      } catch {
        return DEFAULT_SETTINGS
      }
    }
    return parseSettings(raw)
  } catch {
    return DEFAULT_SETTINGS
  }
}
