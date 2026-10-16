import { addDays } from "date-fns"
import { toDate } from "date-fns-tz"
import { createServerClient } from "@/lib/supabase"
import { buildExpertServiceRow } from "@/lib/expert-admin-validation"
import { computeMaterializedSlots, type WeeklyRuleInput } from "@/lib/expert-schedule-materialize"
import { assert, check, MerchantError } from "./errors"
import type { MerchantRow } from "./auth"

export const TRANSLATION_LANGS = ["en", "ru", "fr", "es", "zh", "pt"] as const
export const MAX_WINDOW_DAYS = 120
export const MAX_SLOT_RANGE_DAYS = 60
export const MAX_TIME_OFF_DAYS = 366
export const SERVICE_CONTENT_FIELDS = ["title", "short_description", "translations", "meeting_instructions"] as const
export const SLOT_SELECT = "id, expert_service_id, slot_start, slot_end, status, source, schedule_id, created_at, updated_at"
export const SCHEDULE_SELECT = "id, expert_service_id, timezone, window_start_date, window_end_date, slot_duration_minutes, created_at, updated_at"
export const RULE_SELECT = "id, schedule_id, day_of_week, local_start_time, local_end_time, sort_order"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const DAY_MS = 86_400_000

/* ---------- ownership ---------- */

export async function profileOf(merchantId: string, type?: string) {
  if (type !== undefined) assert(type === "expert", "EXPERT_ONLY", 409)
  const { data, error } = await createServerClient().from("expert_profiles").select("id, display_name, merchant_id").eq("merchant_id", merchantId).limit(1).maybeSingle()
  check(error)
  assert(data, "EXPERT_PROFILE_NOT_FOUND", 404)
  return data as { id: string; display_name: string; merchant_id: string }
}

export async function requireExpertProfile(merchant: Pick<MerchantRow, "id" | "type">) {
  return profileOf(merchant.id, merchant.type)
}

/** Loads a service only if its profile belongs to this merchant. */
export async function assertServiceOwned(merchantId: string, serviceId: string, type?: string) {
  const profile = await profileOf(merchantId, type)
  const { data, error } = await createServerClient().from("expert_services").select("*").eq("id", serviceId).eq("expert_profile_id", profile.id).maybeSingle()
  check(error)
  assert(data, "SERVICE_NOT_FOUND", 404)
  return data as Record<string, any>
}

/* ---------- service content ---------- */

/** Keeps only supported languages with string title / short_description. Throws on malformed input. */
export function sanitizeTranslations(input: unknown): Record<string, { title: string; short_description: string }> {
  if (input == null) return {}
  assert(typeof input === "object" && !Array.isArray(input), "TRANSLATIONS_INVALID", 400)
  const out: Record<string, { title: string; short_description: string }> = {}
  for (const [lang, raw] of Object.entries(input as Record<string, unknown>)) {
    assert((TRANSLATION_LANGS as readonly string[]).includes(lang), "TRANSLATION_LANG_UNSUPPORTED", 400, { lang })
    assert(raw && typeof raw === "object" && !Array.isArray(raw), "TRANSLATIONS_INVALID", 400, { lang })
    const r = raw as Record<string, unknown>
    assert(r.title == null || typeof r.title === "string", "TRANSLATIONS_INVALID", 400, { lang })
    assert(r.short_description == null || typeof r.short_description === "string", "TRANSLATIONS_INVALID", 400, { lang })
    const title = String(r.title ?? "").trim().slice(0, 200)
    const short = String(r.short_description ?? "").trim().slice(0, 1000)
    if (title || short) out[lang] = { title, short_description: short }
  }
  return out
}

/**
 * Builds the row to write for a seller service. `existing` (PATCH) provides defaults for omitted fields.
 * Ownership (`expert_profile_id`) is always forced; `review_status` is decided by the caller.
 */
export function buildSellerService(body: Record<string, any>, profileId: string, existing: Record<string, any> | null) {
  const merged: Record<string, unknown> = existing ? { ...existing, ...body } : { ...body }
  const { row, error } = buildExpertServiceRow(merged)
  if (error) throw new MerchantError("SERVICE_INVALID", 400, { message: error })
  const out: Record<string, any> = { ...row, expert_profile_id: profileId }
  out.translations = body.translations !== undefined ? sanitizeTranslations(body.translations) : existing?.translations ?? {}
  return out
}

export function serviceContentChanged(next: Record<string, any>, existing: Record<string, any>) {
  return SERVICE_CONTENT_FIELDS.some((f) => JSON.stringify(next[f] ?? (f === "translations" ? {} : null)) !== JSON.stringify(existing[f] ?? (f === "translations" ? {} : null)))
}

/* ---------- dates ---------- */

export function validTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz.trim() })
    return true
  } catch {
    return false
  }
}

function daysBetweenDates(a: string, b: string) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS)
}

/** Validates a schedule window (YYYY-MM-DD, inclusive). Returns number of days covered. */
export function validateWindow(start: unknown, end: unknown, maxDays = MAX_WINDOW_DAYS): { start: string; end: string; days: number } {
  const s = String(start || "").trim()
  const e = String(end || "").trim()
  assert(DATE_RE.test(s) && DATE_RE.test(e) && !Number.isNaN(Date.parse(s)) && !Number.isNaN(Date.parse(e)), "WINDOW_INVALID", 400)
  assert(e >= s, "WINDOW_ORDER", 400)
  const days = daysBetweenDates(s, e) + 1
  assert(days <= maxDays, "WINDOW_TOO_LONG", 400, { maxDays })
  return { start: s, end: e, days }
}

/** Parses an instant: ISO datetime, or a YYYY-MM-DD civil date resolved in `timeZone` (start or end of that day). */
export function parseInstant(value: unknown, timeZone: string, endOfDay = false): Date {
  const v = String(value || "").trim()
  assert(v, "RANGE_INVALID", 400)
  if (DATE_RE.test(v)) {
    const d = toDate(`${v} ${endOfDay ? "23:59:59.999" : "00:00:00"}`, { timeZone })
    assert(!Number.isNaN(d.getTime()), "RANGE_INVALID", 400)
    return d
  }
  const d = new Date(v)
  assert(!Number.isNaN(d.getTime()), "RANGE_INVALID", 400)
  return d
}

export function parseRange(from: unknown, to: unknown, maxDays: number, timeZone = "UTC", defaults?: { from: Date; to: Date }): { from: Date; to: Date } {
  const f = from ? parseInstant(from, timeZone, false) : defaults?.from
  const t = to ? parseInstant(to, timeZone, true) : defaults?.to
  assert(f && t, "RANGE_INVALID", 400)
  assert(t > f, "RANGE_ORDER", 400)
  assert(t.getTime() - f.getTime() <= maxDays * DAY_MS, "RANGE_TOO_LONG", 400, { maxDays })
  return { from: f, to: t }
}

export function parseWeeklyRules(input: unknown): WeeklyRuleInput[] {
  assert(Array.isArray(input), "WEEKLY_RULES_INVALID", 400)
  const out: WeeklyRuleInput[] = []
  for (const raw of input) {
    assert(raw && typeof raw === "object", "WEEKLY_RULES_INVALID", 400)
    const o = raw as Record<string, unknown>
    const dow = Number(o.day_of_week)
    assert(Number.isInteger(dow) && dow >= 0 && dow <= 6, "DAY_OF_WEEK_INVALID", 400)
    const ls = String(o.local_start_time || "").trim()
    const le = String(o.local_end_time || "").trim()
    assert(/^\d{2}:\d{2}(:\d{2})?$/.test(ls) && /^\d{2}:\d{2}(:\d{2})?$/.test(le), "RULE_TIME_INVALID", 400)
    assert(le > ls, "RULE_TIME_ORDER", 400)
    out.push({ day_of_week: dow, local_start_time: ls, local_end_time: le, sort_order: o.sort_order != null ? Number(o.sort_order) || 0 : 0 })
  }
  return out
}

export function parseScheduleBody(body: Record<string, any>) {
  const timezone = String(body.timezone || "").trim()
  assert(timezone, "TIMEZONE_REQUIRED", 400)
  assert(validTimeZone(timezone), "TIMEZONE_INVALID", 400)
  const window = validateWindow(body.window_start_date, body.window_end_date)
  let slotDur: number | null = null
  if (body.slot_duration_minutes != null && body.slot_duration_minutes !== "") {
    slotDur = Number(body.slot_duration_minutes)
    assert(Number.isInteger(slotDur) && slotDur > 0 && slotDur <= 1440, "SLOT_DURATION_INVALID", 400)
  }
  return { timezone, window, slotDur, rules: parseWeeklyRules(body.weekly_rules) }
}

/* ---------- slot generation ---------- */

export function slotDuration(schedule: { slot_duration_minutes?: number | null }, service: { default_duration_minutes?: number | null }) {
  if (schedule.slot_duration_minutes != null && Number(schedule.slot_duration_minutes) > 0) return Number(schedule.slot_duration_minutes)
  if (service.default_duration_minutes != null && Number(service.default_duration_minutes) > 0) return Number(service.default_duration_minutes)
  return 60
}

/** Slots (ISO start/end) that the schedule would generate in the next `days` days. Pure. */
export function previewSlots(params: {
  windowStartDate: string
  windowEndDate: string
  timeZone: string
  durationMinutes: number
  weeklyRules: WeeklyRuleInput[]
  bookedIntervals?: { start: Date; end: Date }[]
  now?: Date
  days?: number
}): { start: string; end: string }[] {
  const now = params.now ?? new Date()
  const horizon = addDays(now, params.days ?? 14)
  return computeMaterializedSlots({
    windowStartDate: params.windowStartDate,
    windowEndDate: params.windowEndDate,
    timeZone: params.timeZone,
    durationMinutes: params.durationMinutes,
    weeklyRules: params.weeklyRules,
    bookedIntervals: params.bookedIntervals ?? [],
    now,
  })
    .filter((s) => new Date(s.slot_start) <= horizon)
    .map((s) => ({ start: s.slot_start, end: s.slot_end }))
}

export async function loadSchedule(serviceId: string) {
  const server = createServerClient()
  const { data: schedule, error } = await server.from("expert_service_schedules").select(SCHEDULE_SELECT).eq("expert_service_id", serviceId).maybeSingle()
  check(error)
  if (!schedule) return { schedule: null, weekly_rules: [] as any[] }
  const { data: rules, error: re } = await server.from("expert_service_weekly_rules").select(RULE_SELECT).eq("schedule_id", schedule.id).order("day_of_week", { ascending: true }).order("sort_order", { ascending: true })
  check(re)
  return { schedule, weekly_rules: rules || [] }
}

/**
 * Copy of the admin regenerate logic: replaces future schedule-sourced available slots with a fresh set.
 * Booked and blocked intervals are never overwritten.
 */
export async function regenerateSlots(service: Record<string, any>) {
  const server = createServerClient()
  const { schedule, weekly_rules } = await loadSchedule(service.id as string)
  assert(schedule, "SCHEDULE_REQUIRED", 400)
  const rules = weekly_rules as WeeklyRuleInput[]
  const now = new Date()
  const nowIso = now.toISOString()
  const duration = slotDuration(schedule, service)

  const { data: taken, error: bErr } = await server.from("expert_service_slots").select("slot_start, slot_end").eq("expert_service_id", service.id).in("status", ["booked", "blocked"])
  check(bErr)
  const bookedIntervals = (taken || []).map((r: any) => ({ start: new Date(r.slot_start), end: new Date(r.slot_end) }))

  const candidates = rules.length
    ? computeMaterializedSlots({ windowStartDate: schedule.window_start_date, windowEndDate: schedule.window_end_date, timeZone: schedule.timezone, durationMinutes: duration, weeklyRules: rules, bookedIntervals, now })
    : []

  const { error: delErr } = await server.from("expert_service_slots").delete().eq("expert_service_id", service.id).eq("source", "schedule").eq("status", "available").gt("slot_start", nowIso)
  check(delErr)

  const rows = candidates.map((c) => ({ expert_service_id: service.id, slot_start: c.slot_start, slot_end: c.slot_end, status: "available", source: "schedule", schedule_id: schedule.id, updated_at: nowIso }))
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await server.from("expert_service_slots").insert(rows.slice(i, i + 200))
    check(error)
  }
  return { inserted: rows.length, preview: previewSlots({ windowStartDate: schedule.window_start_date, windowEndDate: schedule.window_end_date, timeZone: schedule.timezone, durationMinutes: duration, weeklyRules: rules, bookedIntervals, now }) }
}

/* ---------- slots ---------- */

export async function loadOwnedSlot(serviceId: string, slotId: string) {
  const { data, error } = await createServerClient().from("expert_service_slots").select(SLOT_SELECT).eq("id", slotId).eq("expert_service_id", serviceId).maybeSingle()
  check(error)
  assert(data, "SLOT_NOT_FOUND", 404)
  return data as Record<string, any>
}

export function parseSlotInput(body: Record<string, any>, now = new Date()) {
  const start = new Date(String(body.slot_start || ""))
  const end = new Date(String(body.slot_end || ""))
  assert(!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()), "SLOT_INVALID", 400)
  assert(end > start, "SLOT_ORDER", 400)
  assert(end.getTime() - start.getTime() <= 24 * 3_600_000, "SLOT_TOO_LONG", 400)
  assert(start > now, "SLOT_IN_PAST", 400)
  return { start, end }
}

export function parseSlotStatus(v: unknown): "available" | "blocked" {
  const s = String(v ?? "").trim().toLowerCase()
  assert(s === "available" || s === "blocked", "SLOT_STATUS_INVALID", 400)
  return s
}

/** Blocks every still-available slot in [from, to) for the given services. Returns the number blocked. */
export async function blockRange(serviceIds: string[], from: Date, to: Date): Promise<number> {
  if (serviceIds.length === 0) return 0
  const { data, error } = await createServerClient()
    .from("expert_service_slots")
    .update({ status: "blocked", updated_at: new Date().toISOString() })
    .in("expert_service_id", serviceIds)
    .eq("status", "available")
    .lt("slot_start", to.toISOString())
    .gt("slot_end", from.toISOString())
    .gt("slot_start", new Date().toISOString())
    .select("id")
  check(error)
  return (data || []).length
}

/* ---------- bookings ---------- */

export type BookingScope = "upcoming" | "past" | "requests"

/** Pure filter over orders' seller view. `requests` = awaiting acceptance; `upcoming` = accepted and not yet ended. */
export function bookingInScope(o: { status: string; slot: { end?: string } | null }, scope: BookingScope | null, now = new Date()): boolean {
  if (!scope) return true
  if (scope === "requests") return o.status === "new"
  const ended = o.slot?.end ? new Date(o.slot.end) < now : false
  if (scope === "upcoming") return (o.status === "accepted" || o.status === "preparing") && !ended
  return o.status === "completed" || o.status === "cancelled" || ended
}

export function toBooking(seller: any) {
  return {
    id: seller.id,
    publicId: seller.publicId,
    status: seller.status,
    paymentState: seller.paymentState,
    slot: seller.slot,
    customerName: seller.customer?.name ?? null,
    serviceTitle: seller.title ?? seller.items?.[0]?.title ?? null,
    totals: seller.totals,
    actions: seller.actions,
    exception: seller.exception,
    createdAt: seller.createdAt,
    dueAt: seller.dueAt,
    overdue: seller.overdue,
  }
}

export function parseMeeting(body: Record<string, any>) {
  let url: string | null = null
  if (body.meetingUrl != null && body.meetingUrl !== "") {
    assert(typeof body.meetingUrl === "string" && body.meetingUrl.length <= 500, "MEETING_URL_INVALID", 400)
    try {
      const u = new URL(body.meetingUrl.trim())
      assert(u.protocol === "https:", "MEETING_URL_INVALID", 400)
      url = u.toString()
    } catch (e) {
      if (e instanceof MerchantError) throw e
      throw new MerchantError("MEETING_URL_INVALID", 400)
    }
  }
  let instructions: string | null = null
  if (body.instructions != null && body.instructions !== "") {
    assert(typeof body.instructions === "string", "INSTRUCTIONS_INVALID", 400)
    instructions = body.instructions.trim().slice(0, 2000) || null
  }
  assert(url || instructions, "MEETING_EMPTY", 400)
  return { url, instructions }
}
