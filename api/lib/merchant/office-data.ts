import { createServerClient } from "@/lib/supabase"
import { MerchantError, check } from "./errors"
import { audit } from "./audit"
import {
  AUDIT_FILTER_KEYS, DEFAULT_LISTING_REASONS, DEFAULT_SLA, claimOutcome, isUuid, slaState, QUEUE_PERMISSION, UNAVAILABLE, businessHoursBetween, displayName, isMissingSchema, parseSla, slaCutoff, visibleQueues,
  type AuditRow, auditRange, type QueueCount, type QueueKey, type ReasonTemplate, type SlaSettings, type SlaState,
} from "./office"

type DB = ReturnType<typeof createServerClient>

/** SLA targets from `marketplace_settings.office_sla` merged over the defaults. Never throws: a missing table gives defaults. */
export async function loadSla(db: DB = createServerClient()): Promise<SlaSettings> {
  const { data, error } = await db.from("marketplace_settings").select("value").eq("key", "office_sla").maybeSingle()
  if (error) {
    if (!isMissingSchema(error)) console.error("office sla read failed", error.code, error.message)
    return { ...DEFAULT_SLA }
  }
  return parseSla(data?.value)
}

/** Names and emails for admin ids (Office staff). Unknown ids are simply absent. */
export async function adminDirectory(db: DB, ids: Array<string | null | undefined>): Promise<Record<string, { name: string | null; email: string | null }>> {
  const unique = Array.from(new Set(ids.filter((x): x is string => !!x)))
  if (unique.length === 0) return {}
  const { data, error } = await db.from("admin_users").select("id,name,email").in("id", unique)
  if (error) {
    if (!isMissingSchema(error)) console.error("admin directory read failed", error.code, error.message)
    return {}
  }
  return Object.fromEntries((data || []).map((a: any) => [a.id, { name: displayName(null, null, a.name), email: a.email ?? null }]))
}

/** Names and emails for customer accounts (merchant users acting in the audit log). */
export async function userDirectory(db: DB, ids: Array<string | null | undefined>): Promise<Record<string, { name: string | null; email: string | null }>> {
  const unique = Array.from(new Set(ids.filter((x): x is string => !!x)))
  if (unique.length === 0) return {}
  const { data, error } = await db.from("users").select("id,email,first_name,last_name").in("id", unique)
  if (error) {
    if (!isMissingSchema(error)) console.error("user directory read failed", error.code, error.message)
    return {}
  }
  return Object.fromEntries((data || []).map((u: any) => [u.id, { name: displayName(u.first_name, u.last_name), email: u.email ?? null }]))
}

// ---------------------------------------------------------------------------------------------
// queue counts
// ---------------------------------------------------------------------------------------------
interface QueueSpec {
  table: string
  date: string
  apply: (q: any) => any
  limitHours: number | null
  /** Business-hours SLA: count breaches in JS from the oldest rows. */
  business?: { start: number; end: number }
  mine?: { table: string; apply: (q: any) => any }
}

const BUSINESS_SCAN = 1000

async function countQueue(db: DB, adminId: string, s: QueueSpec): Promise<QueueCount> {
  const head = (extra?: (q: any) => any) => {
    let q = s.apply(db.from(s.table).select(s.date, { count: "exact", head: true }))
    if (extra) q = extra(q)
    return q
  }
  const total = await head()
  if (total.error) throw total.error
  const count = total.count ?? 0
  let oldest: string | null = null
  let overSla: number | null = null

  if (count > 0) {
    const first = await s.apply(db.from(s.table).select(s.date)).not(s.date, "is", null).order(s.date, { ascending: true }).limit(s.business ? BUSINESS_SCAN : 1)
    if (first.error) throw first.error
    const dates: string[] = (first.data || []).map((r: any) => r[s.date]).filter(Boolean)
    oldest = dates[0] ?? null
    if (s.limitHours !== null) {
      if (s.business) {
        const now = new Date()
        overSla = dates.filter((d) => businessHoursBetween(d, now, s.business!.start, s.business!.end) > s.limitHours!).length
      } else {
        const over = await head((q) => q.lt(s.date, slaCutoff(s.limitHours!)))
        if (over.error) throw over.error
        overSla = over.count ?? 0
      }
    }
  } else if (s.limitHours !== null) overSla = 0

  const out: QueueCount = { count, oldest, over_sla: overSla, limit_hours: s.limitHours }
  if (s.mine) {
    const m = await s.mine.apply(db.from(s.mine.table).select("id", { count: "exact", head: true }))
    if (m.error && !isMissingSchema(m.error)) throw m.error
    out.mine = m.error ? 0 : m.count ?? 0
  }
  return out
}

/** Counts and oldest-item age for every queue the role may see. A queue whose table or column is missing reports `unavailable`. */
export async function queueCounts(db: DB, role: string, adminId: string, sla?: SlaSettings): Promise<Partial<Record<QueueKey, QueueCount>>> {
  const s = sla ?? (await loadSla(db))
  const biz = { start: s.business_start_hour, end: s.business_end_hour }
  const specs: Record<QueueKey, QueueSpec[]> = {
    merchants: [{
      table: "merchants", date: "submitted_at", apply: (q) => q.eq("status", "in_review"), limitHours: s.merchant_application,
      mine: { table: "merchant_applications", apply: (q) => q.eq("assigned_to", adminId).in("status", ["submitted", "in_review"]) },
    }],
    payouts: [{ table: "payouts", date: "requested_at", apply: (q) => q.in("status", ["requested", "approved"]), limitHours: s.payout }],
    listings: [
      {
        table: "hub_products", date: "review_requested_at", apply: (q) => q.eq("review_status", "pending").neq("status", "archived"), limitHours: s.listing_review,
        mine: { table: "hub_products", apply: (q) => q.eq("review_assigned_to", adminId).eq("review_status", "pending") },
      },
      // before the Office queue SQL is applied: the last change stands in for "waiting since"
      { table: "hub_products", date: "updated_at", apply: (q) => q.eq("review_status", "pending").neq("status", "archived"), limitHours: s.listing_review },
    ],
    kyc: [{ table: "kyc_submissions", date: "created_at", apply: (q) => q.in("status", ["pending", "in_review"]), limitHours: s.kyc_business_hours, business: biz }],
    transactions: [{ table: "transactions", date: "created_at", apply: (q) => q.eq("status", "pending"), limitHours: null }],
    support: [{
      table: "assistant_requests", date: "created_at", apply: (q) => q.eq("status", "submitted"),
      limitHours: s.support_business_days * (s.business_end_hour - s.business_start_hour), business: biz,
    }],
  }
  const keys = visibleQueues(role)
  const entries = await Promise.all(keys.map(async (k) => {
    let last: unknown = null
    for (const spec of specs[k]) {
      try {
        return [k, await countQueue(db, adminId, spec)] as const
      } catch (e) {
        last = e
        if (!isMissingSchema(e as any)) break
      }
    }
    const err = last as { code?: string; message?: string } | null
    if (err && !isMissingSchema(err)) console.error("queue count failed", k, err.code, err.message)
    return [k, { ...UNAVAILABLE }] as const
  }))
  return Object.fromEntries(entries)
}

export { QUEUE_PERMISSION }

// ---------------------------------------------------------------------------------------------
// owner and SLA on the merchants queue
// ---------------------------------------------------------------------------------------------
export interface OwnerInfo { id: string; name: string | null; email: string | null; claimed_at: string | null; mine: boolean }

/** Adds `owner` (open application assignee) and `sla` (in-review merchants only) to merchant rows. */
export async function withOwnerAndSla<T extends { id: string; status: string; submitted_at: string | null; created_at: string }>(
  db: DB, rows: T[], sla: SlaSettings, adminId: string,
): Promise<Array<T & { owner: OwnerInfo | null; sla: SlaState | null }>> {
  if (rows.length === 0) return []
  const ids = rows.map((r) => r.id)
  const open = ["submitted", "in_review"]
  let apps: any[] = []
  const withClaim = await db.from("merchant_applications").select("merchant_id,assigned_to,claimed_at").in("merchant_id", ids).in("status", open)
  if (!withClaim.error) apps = withClaim.data || []
  else if (isMissingSchema(withClaim.error)) {
    const plain = await db.from("merchant_applications").select("merchant_id,assigned_to").in("merchant_id", ids).in("status", open)
    if (!plain.error) apps = plain.data || []
  } else console.error("owner read failed", withClaim.error.code, withClaim.error.message)
  const byMerchant = new Map<string, any>(apps.map((a) => [a.merchant_id, a]))
  const dir = await adminDirectory(db, apps.map((a) => a.assigned_to))
  const now = new Date()
  return rows.map((r) => {
    const a = byMerchant.get(r.id)
    const owner: OwnerInfo | null = a?.assigned_to
      ? { id: a.assigned_to, name: dir[a.assigned_to]?.name ?? null, email: dir[a.assigned_to]?.email ?? null, claimed_at: a.claimed_at ?? null, mine: a.assigned_to === adminId }
      : null
    return { ...r, owner, sla: r.status === "in_review" ? slaState(r.submitted_at ?? r.created_at, sla.merchant_application, now) : null }
  })
}

// ---------------------------------------------------------------------------------------------
// claim / release (atomic in SQL: `office_claim`)
// ---------------------------------------------------------------------------------------------

/**
 * Claims (or releases) a merchant application or a listing for an admin and audits it.
 * Second claimer gets 409 CLAIMED_BY_OTHER with the owner. Only super admins may take over or release someone else's claim.
 */
export async function claimItem(
  kind: "merchant" | "listing", id: string,
  admin: { id: string; role: string }, opts: { release?: boolean; merchantId?: string | null } = {},
) {
  if (!isUuid(id)) throw new MerchantError("NOT_FOUND", 404)
  const db = createServerClient()
  const { data, error } = await db.rpc("office_claim", { p_kind: kind, p_id: id, p_admin: admin.id, p_release: !!opts.release, p_force: admin.role === "super_admin" || admin.role === "admin" })
  if (error) {
    if (isMissingSchema(error)) throw new MerchantError("QUEUES_NOT_AVAILABLE", 503)
    check(error)
  }
  const out = claimOutcome(data)
  const dir = await adminDirectory(db, [out.owner])
  await audit({
    actorKind: "admin", actorId: admin.id, actorRole: admin.role, merchantId: kind === "merchant" ? id : opts.merchantId ?? null,
    action: `${kind}.${opts.release ? "released" : "claimed"}`, entityType: kind === "merchant" ? "merchant" : "hub_product", entityId: id,
  })
  return { owner: out.owner ? { id: out.owner, name: dir[out.owner]?.name ?? null, email: dir[out.owner]?.email ?? null, claimed_at: out.claimed_at, mine: out.owner === admin.id } : null }
}

/** Active rejection templates for a scope, falling back to the built-in list when the table is not there yet. */
export async function loadReasons(db: DB, scope = "listing_rejection"): Promise<ReasonTemplate[]> {
  const { data, error } = await db.from("reason_templates").select("key,label,text,translations,needs_message").eq("scope", scope).eq("active", true).order("sort")
  if (error) {
    if (!isMissingSchema(error)) console.error("reason templates read failed", error.code, error.message)
    return DEFAULT_LISTING_REASONS
  }
  return data && data.length ? (data as ReasonTemplate[]) : DEFAULT_LISTING_REASONS
}

// ---------------------------------------------------------------------------------------------
// listings
// ---------------------------------------------------------------------------------------------
const LISTING_BASE = "id,title,short_description,category,status,review_status,review_note,fixed_amount,fixed_currency,list_price,sale_price,image_url,service_line_slug,vendor_id,merchant_id,created_at,updated_at,hub_vendors(name,slug),merchants(display_name)"
export const LISTING_QUEUE_COLUMNS = "review_requested_at,review_assigned_to,review_claimed_at,reviewed_by,reviewed_at,review_reason_key"

/** Select list for listings: with the queue columns when they exist, plain otherwise. */
export async function selectListings(db: DB, build: (select: string, queueCols: boolean) => PromiseLike<{ data: any; error: any; count?: number | null }>) {
  const full = await build(`${LISTING_BASE},${LISTING_QUEUE_COLUMNS}`, true)
  if (full.error && isMissingSchema(full.error)) return build(LISTING_BASE, false)
  return full
}

export function listingView(r: any, queueCols: boolean, sla: SlaSettings, adminId: string, dir: Record<string, { name: string | null; email: string | null }>, now = new Date()) {
  const waitingSince = r.review_requested_at ?? r.updated_at
  const assigned: string | null = queueCols ? r.review_assigned_to ?? null : null
  return {
    ...r,
    waiting_since: r.review_status === "pending" ? waitingSince : null,
    sla: r.review_status === "pending" ? slaState(waitingSince, sla.listing_review, now) : null,
    owner: assigned ? { id: assigned, name: dir[assigned]?.name ?? null, email: dir[assigned]?.email ?? null, claimed_at: r.review_claimed_at ?? null, mine: assigned === adminId } : null,
  }
}

// ---------------------------------------------------------------------------------------------
// audit
// ---------------------------------------------------------------------------------------------

/** Filtered audit query shared by the list and the CSV export. Newest first. */
export function auditQuery(db: DB, sp: URLSearchParams, opts: { count?: boolean } = {}) {
  let q: any = db.from("audit_log").select("*", opts.count ? { count: "exact" } : undefined)
  for (const k of AUDIT_FILTER_KEYS) {
    const v = sp.get(k)
    if (v) q = q.eq(k, v)
  }
  const kind = sp.get("actor_kind")
  if (kind === "admin" || kind === "merchant" || kind === "system") q = q.eq("actor_kind", kind)
  const { gte, lt } = auditRange(sp.get("from"), sp.get("to"))
  if (gte) q = q.gte("created_at", gte)
  if (lt) q = q.lt("created_at", lt)
  return q.order("id", { ascending: false })
}

/** Adds actor name and email (Office staff or merchant user) and the merchant's name to audit rows. */
export async function enrichAudit(db: DB, rows: AuditRow[]): Promise<AuditRow[]> {
  const adminIds = rows.filter((r) => r.actor_kind === "admin").map((r) => r.actor_id)
  const userIds = rows.filter((r) => r.actor_kind === "merchant").map((r) => r.actor_id)
  const merchantIds = Array.from(new Set(rows.map((r) => r.merchant_id).filter((x): x is string => !!x)))
  const [admins, users, merchants] = await Promise.all([
    adminDirectory(db, adminIds),
    userDirectory(db, userIds),
    merchantIds.length
      ? db.from("merchants").select("id,display_name").in("id", merchantIds).then((r) => (r.error ? {} : Object.fromEntries((r.data || []).map((m: any) => [m.id, m.display_name as string]))))
      : Promise.resolve({} as Record<string, string>),
  ])
  return rows.map((r) => {
    const who = r.actor_id ? (r.actor_kind === "admin" ? admins[r.actor_id] : r.actor_kind === "merchant" ? users[r.actor_id] : undefined) : undefined
    return { ...r, actor_name: who?.name ?? null, actor_email: who?.email ?? null, merchant_name: r.merchant_id ? (merchants as Record<string, string>)[r.merchant_id] ?? null : null }
  })
}
