import { MerchantError } from "./errors"
import { adminCan, type AdminPermission } from "@/lib/admin-roles"

/**
 * Office queue helpers: SLA maths, schema feature detection, claim results, search and CSV helpers.
 * Pure functions only (no database), so they are covered by unit tests.
 */

// ---------------------------------------------------------------------------------------------
// feature detection: the live database may not have the Office queue SQL yet
// ---------------------------------------------------------------------------------------------
const MISSING_CODES = new Set(["42P01", "42703", "42883", "PGRST205", "PGRST204", "PGRST202"])

/** True when a Postgres/PostgREST error means "table, column or function does not exist (yet)". */
export function isMissingSchema(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false
  if (error.code && MISSING_CODES.has(error.code)) return true
  return /does not exist|could not find the .* (column|table|function)|schema cache/i.test(error.message || "")
}

// ---------------------------------------------------------------------------------------------
// SLA
// ---------------------------------------------------------------------------------------------
export interface SlaSettings {
  merchant_application: number
  listing_review: number
  payout: number
  kyc_business_hours: number
  support_business_days: number
  business_start_hour: number
  business_end_hour: number
}

export const DEFAULT_SLA: SlaSettings = {
  merchant_application: 24,
  listing_review: 12,
  payout: 48,
  kyc_business_hours: 4,
  support_business_days: 1,
  business_start_hour: 9,
  business_end_hour: 18,
}

/** Merges stored values over the defaults; ignores anything that is not a sensible number. */
export function parseSla(raw: unknown): SlaSettings {
  const out: SlaSettings = { ...DEFAULT_SLA }
  if (raw && typeof raw === "object") {
    for (const k of Object.keys(DEFAULT_SLA) as (keyof SlaSettings)[]) {
      const v = Number((raw as Record<string, unknown>)[k])
      if (Number.isFinite(v) && (v > 0 || (k === "business_start_hour" && v === 0)) && v <= 24 * 30) out[k] = v
    }
  }
  if (out.business_end_hour <= out.business_start_hour || out.business_end_hour > 24) {
    out.business_start_hour = DEFAULT_SLA.business_start_hour
    out.business_end_hour = DEFAULT_SLA.business_end_hour
  }
  return out
}

/** Validates an Office edit of the SLA settings. Returns the cleaned partial or an error code. */
export function validateSlaUpdate(body: Record<string, unknown>): { ok: true; value: Partial<SlaSettings> } | { ok: false; code: string } {
  const value: Partial<SlaSettings> = {}
  for (const k of Object.keys(DEFAULT_SLA) as (keyof SlaSettings)[]) {
    if (!(k in body)) continue
    const v = Number(body[k])
    const hourKey = k === "business_start_hour" || k === "business_end_hour"
    const min = k === "business_start_hour" ? 0 : 1
    if (!Number.isFinite(v) || v < min) return { ok: false, code: "SLA_INVALID" }
    if (hourKey ? !Number.isInteger(v) || v > 24 : v > 24 * 30) return { ok: false, code: "SLA_INVALID" }
    value[k] = v
  }
  if (Object.keys(value).length === 0) return { ok: false, code: "NOTHING_TO_UPDATE" }
  const start = value.business_start_hour, end = value.business_end_hour
  if (start !== undefined && end !== undefined && end <= start) return { ok: false, code: "SLA_INVALID" }
  return { ok: true, value }
}

const HOUR = 3_600_000

/** Hours between two instants, counting only Mon-Fri between the business hours (UTC). Used for "business hours" SLAs. */
export function businessHoursBetween(fromIso: string | Date, to: Date, startHour = 9, endHour = 18): number {
  const from = new Date(fromIso)
  if (isNaN(from.getTime()) || to <= from) return 0
  let total = 0
  const day = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()))
  while (day.getTime() <= to.getTime()) {
    const dow = day.getUTCDay()
    if (dow !== 0 && dow !== 6) {
      const open = day.getTime() + startHour * HOUR
      const close = day.getTime() + endHour * HOUR
      const a = Math.max(open, from.getTime())
      const b = Math.min(close, to.getTime())
      if (b > a) total += (b - a) / HOUR
    }
    day.setUTCDate(day.getUTCDate() + 1)
  }
  return total
}

export interface SlaState {
  /** Target in hours (calendar, or business hours when `business` is true). */
  limit_hours: number
  business: boolean
  /** Hours waited so far (calendar or business, matching `business`). */
  waited_hours: number
  /** Hours past the target, null while within it. */
  over_by_hours: number | null
  breached: boolean
}

export function slaState(startIso: string | null | undefined, limitHours: number, now = new Date(), opts: { business?: boolean; startHour?: number; endHour?: number } = {}): SlaState | null {
  if (!startIso) return null
  const start = new Date(startIso)
  if (isNaN(start.getTime())) return null
  const waited = opts.business
    ? businessHoursBetween(start, now, opts.startHour, opts.endHour)
    : Math.max(0, (now.getTime() - start.getTime()) / HOUR)
  const over = waited > limitHours ? waited - limitHours : null
  return { limit_hours: limitHours, business: !!opts.business, waited_hours: round1(waited), over_by_hours: over === null ? null : round1(over), breached: over !== null }
}

const round1 = (n: number) => Math.round(n * 10) / 10

/** ISO cutoff: items submitted before this are over a calendar-hours SLA. */
export function slaCutoff(limitHours: number, now = new Date()): string {
  return new Date(now.getTime() - limitHours * HOUR).toISOString()
}

// ---------------------------------------------------------------------------------------------
// queues
// ---------------------------------------------------------------------------------------------
export type QueueKey = "merchants" | "payouts" | "listings" | "kyc" | "transactions" | "support"

/** Permission each queue needs. A caller only receives the queues they can work. */
export const QUEUE_PERMISSION: Record<QueueKey, AdminPermission> = {
  merchants: "merchants.review",
  payouts: "finance.manage",
  listings: "listings.review",
  kyc: "users.read",
  transactions: "support.read",
  support: "support.read",
}

export function visibleQueues(role: string | null | undefined): QueueKey[] {
  return (Object.keys(QUEUE_PERMISSION) as QueueKey[]).filter((k) => adminCan(role, QUEUE_PERMISSION[k]))
}

export interface QueueCount {
  count: number
  oldest: string | null
  over_sla: number | null
  limit_hours: number | null
  /** Items the caller has claimed (merchants and listings only). */
  mine?: number
  /** True when the table or column is not on the database yet; show a calm "unavailable" state. */
  unavailable?: boolean
}

export const UNAVAILABLE: QueueCount = { count: 0, oldest: null, over_sla: null, limit_hours: null, unavailable: true }

// ---------------------------------------------------------------------------------------------
// claims
// ---------------------------------------------------------------------------------------------
export interface ClaimResult { ok: boolean; code?: string; owner?: string | null; claimed_at?: string | null }

/** Turns the `office_claim` result into either `{owner, claimed_at}` or a clear error (409 CLAIMED_BY_OTHER, 404 NOT_FOUND). */
export function claimOutcome(result: unknown): { owner: string | null; claimed_at: string | null } {
  const r = (result || {}) as ClaimResult
  if (r.ok) return { owner: r.owner ?? null, claimed_at: r.claimed_at ?? null }
  if (r.code === "CLAIMED") throw new MerchantError("CLAIMED_BY_OTHER", 409, { owner: r.owner ?? null, claimed_at: r.claimed_at ?? null })
  if (r.code === "NOT_FOUND") throw new MerchantError("NOT_FOUND", 404)
  throw new MerchantError("INVALID_REQUEST", 400)
}

// ---------------------------------------------------------------------------------------------
// reasons
// ---------------------------------------------------------------------------------------------
export interface ReasonTemplate { key: string; label: string; text: string; translations?: Record<string, string> | null; needs_message?: boolean }

/** Same eight templates the migration seeds; used when `reason_templates` is not on the database yet. */
export const DEFAULT_LISTING_REASONS: ReasonTemplate[] = [
  { key: "prohibited_item", label: "Prohibited item", text: "This item is not allowed on Ciuna. Remove it or replace it with a permitted item." },
  { key: "unclear_photos", label: "Unclear photos", text: "The photos are unclear. Upload sharp, well-lit photos of the actual item." },
  { key: "wrong_category", label: "Wrong category", text: "The listing is in the wrong category. Choose the category that fits the item." },
  { key: "missing_information", label: "Missing information", text: "The listing is missing information buyers need. Complete the description and details." },
  { key: "misleading", label: "Price or description misleading", text: "The price or description is misleading. Make them match what the buyer receives." },
  { key: "contact_details", label: "Contact details in listing", text: "The listing contains contact details. Remove them; buyers reach you through Ciuna." },
  { key: "duplicate", label: "Duplicate listing", text: "This duplicates another listing. Keep one and archive the other." },
  { key: "other", label: "Other", text: "Other reason.", needs_message: true },
]

/** The note a seller sees: the chosen template text plus Office's optional message, verbatim. "Other" needs a message. */
export function buildReviewNote(template: ReasonTemplate, message: unknown, lang = "en"): string {
  const msg = String(message ?? "").trim().slice(0, 1000)
  if (template.needs_message && msg.length < 5) throw new MerchantError("REASON_REQUIRED", 422)
  const base = template.needs_message ? "" : (template.translations?.[lang] || template.text)
  return [base, msg].filter(Boolean).join("\n\n")
}

// ---------------------------------------------------------------------------------------------
// search
// ---------------------------------------------------------------------------------------------
export const SEARCH_MIN = 2
export const SEARCH_LIMIT = 6
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Removes characters that would break a PostgREST filter or act as LIKE wildcards. Returns null when too short. */
export function cleanSearch(q: string | null | undefined): string | null {
  const s = String(q ?? "").replace(/[%_,()\\*"']/g, " ").replace(/\s+/g, " ").trim().slice(0, 60)
  return s.length >= SEARCH_MIN ? s : null
}
export const isUuid = (s: string) => UUID.test(s)

export type SearchKind = "merchant" | "order" | "payout"
export const SEARCH_PERMISSION: Record<SearchKind, AdminPermission> = { merchant: "merchants.read", order: "orders.manage", payout: "finance.manage" }

export function searchKinds(role: string | null | undefined): SearchKind[] {
  return (Object.keys(SEARCH_PERMISSION) as SearchKind[]).filter((k) => adminCan(role, SEARCH_PERMISSION[k]))
}

// ---------------------------------------------------------------------------------------------
// saved views
// ---------------------------------------------------------------------------------------------
export const VIEW_SCOPES = ["merchants", "payouts", "audit", "listings"] as const
export type ViewScope = (typeof VIEW_SCOPES)[number]
export const VIEW_SCOPE_PERMISSION: Record<ViewScope, AdminPermission> = {
  merchants: "merchants.read",
  payouts: "finance.manage",
  audit: "audit.read",
  listings: "listings.review",
}
export const MAX_VIEWS_PER_SCOPE = 20

export function validateView(body: Record<string, unknown>): { scope: ViewScope; name: string; filters: Record<string, string | number | boolean> } {
  const scope = body.scope as ViewScope
  if (!VIEW_SCOPES.includes(scope)) throw new MerchantError("VIEW_SCOPE_INVALID", 400)
  const name = String(body.name ?? "").trim()
  if (name.length < 1 || name.length > 60) throw new MerchantError("VIEW_NAME_INVALID", 400)
  const raw = body.filters
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new MerchantError("VIEW_FILTERS_INVALID", 400)
  const filters: Record<string, string | number | boolean> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^[a-z_]{1,30}$/.test(k)) throw new MerchantError("VIEW_FILTERS_INVALID", 400)
    if (typeof v === "string") { if (v.length > 120) throw new MerchantError("VIEW_FILTERS_INVALID", 400); if (v) filters[k] = v }
    else if (typeof v === "number" || typeof v === "boolean") filters[k] = v
    else if (v !== null && v !== undefined) throw new MerchantError("VIEW_FILTERS_INVALID", 400)
  }
  return { scope, name, filters }
}

// ---------------------------------------------------------------------------------------------
// audit
// ---------------------------------------------------------------------------------------------
export const AUDIT_FILTER_KEYS = ["merchant_id", "entity_type", "entity_id", "action", "actor_id"] as const
export const AUDIT_EXPORT_MAX = 5000

const dateOnly = /^\d{4}-\d{2}-\d{2}$/
/** `from` and `to` are inclusive dates (YYYY-MM-DD) or ISO instants; returns ISO bounds or null. */
export function auditRange(from: string | null, to: string | null): { gte: string | null; lt: string | null } {
  const lo = from && (dateOnly.test(from) || !isNaN(Date.parse(from))) ? new Date(dateOnly.test(from) ? `${from}T00:00:00Z` : from) : null
  let hi: Date | null = null
  if (to && (dateOnly.test(to) || !isNaN(Date.parse(to)))) {
    hi = new Date(dateOnly.test(to) ? `${to}T00:00:00Z` : to)
    if (dateOnly.test(to)) hi.setUTCDate(hi.getUTCDate() + 1)
  }
  return { gte: lo && !isNaN(lo.getTime()) ? lo.toISOString() : null, lt: hi && !isNaN(hi.getTime()) ? hi.toISOString() : null }
}

export interface AuditRow {
  id: number
  created_at: string
  actor_kind: string
  actor_id: string | null
  actor_role: string | null
  actor_name?: string | null
  actor_email?: string | null
  merchant_id: string | null
  merchant_name?: string | null
  action: string
  entity_type: string
  entity_id: string | null
  details: unknown
}

/** CSV cell: quoted when needed, and neutralised against spreadsheet formula injection. */
export function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export const AUDIT_CSV_HEADER = ["id", "when", "actor_kind", "actor_name", "actor_email", "actor_role", "actor_id", "action", "entity_type", "entity_id", "merchant_name", "merchant_id", "details"]

export function auditCsv(rows: AuditRow[]): string {
  const lines = [AUDIT_CSV_HEADER.join(",")]
  for (const r of rows) {
    lines.push([r.id, r.created_at, r.actor_kind, r.actor_name, r.actor_email, r.actor_role, r.actor_id, r.action, r.entity_type, r.entity_id, r.merchant_name, r.merchant_id, r.details].map(csvCell).join(","))
  }
  return lines.join("\n") + "\n"
}

export function displayName(first?: string | null, last?: string | null, name?: string | null): string | null {
  const n = (name || [first, last].filter(Boolean).join(" ")).trim()
  return n || null
}
