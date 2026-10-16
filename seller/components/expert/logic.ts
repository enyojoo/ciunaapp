/** Pure helpers for the expert sections. No React, no network. */

export interface TimeRange { start: string; end: string }
export type WeekRanges = Record<number, TimeRange[]>
export interface ApiRule { day_of_week: number; local_start_time: string; local_end_time: string; sort_order?: number }

/** Mon-first display order; the API uses 0 = Sunday. */
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const
export const MAX_WINDOW_DAYS = 120
export const DEFAULT_WINDOW_DAYS = 60

export type RangeIssue = "order" | "overlap" | "empty"

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}
const hhmm = (v: string) => (v || "").slice(0, 5)

/** Issues per range index for one day. A range with end <= start is "order"; ranges that intersect are both "overlap". Touching ranges are fine. */
export function validateDay(ranges: TimeRange[]): Record<number, RangeIssue> {
  const issues: Record<number, RangeIssue> = {}
  ranges.forEach((r, i) => {
    if (!r.start || !r.end) issues[i] = "empty"
    else if (toMin(r.end) <= toMin(r.start)) issues[i] = "order"
  })
  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      const a = ranges[i]
      const b = ranges[j]
      if (!a.start || !a.end || !b.start || !b.end) continue
      if (toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end)) {
        issues[i] = issues[i] ?? "overlap"
        issues[j] = issues[j] ?? "overlap"
      }
    }
  }
  return issues
}

/** All issues in a week, keyed by `${day}:${index}`. Empty object means valid. */
export function validateWeek(week: WeekRanges): Record<string, RangeIssue> {
  const out: Record<string, RangeIssue> = {}
  for (const d of DAY_ORDER) {
    const issues = validateDay(week[d] ?? [])
    for (const [i, v] of Object.entries(issues)) out[`${d}:${i}`] = v
  }
  return out
}

export const emptyWeek = (): WeekRanges => ({ 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] })

export function weekFromRules(rules: ApiRule[]): WeekRanges {
  const week = emptyWeek()
  const sorted = [...rules].sort((a, b) => a.day_of_week - b.day_of_week || (a.sort_order ?? 0) - (b.sort_order ?? 0) || hhmm(a.local_start_time).localeCompare(hhmm(b.local_start_time)))
  for (const r of sorted) week[r.day_of_week]?.push({ start: hhmm(r.local_start_time), end: hhmm(r.local_end_time) })
  return week
}

export function rulesFromWeek(week: WeekRanges): ApiRule[] {
  const out: ApiRule[] = []
  for (const d of DAY_ORDER) {
    const sorted = [...(week[d] ?? [])].sort((a, b) => a.start.localeCompare(b.start))
    sorted.forEach((r, i) => out.push({ day_of_week: d, local_start_time: r.start, local_end_time: r.end, sort_order: i }))
  }
  return out
}

/** Copies one day's ranges onto the given days (replacing them). */
export function copyDay(week: WeekRanges, from: number, to: number[]): WeekRanges {
  const next: WeekRanges = { ...week }
  for (const d of to) if (d !== from) next[d] = (week[from] ?? []).map((r) => ({ ...r }))
  return next
}

/* ---------- units ---------- */

export type DurationUnit = "minutes" | "hours"

/** 120 -> { amount: 2, unit: "hours" }, 90 -> { amount: 90, unit: "minutes" }, 0 -> 0 minutes. */
export function splitMinutes(minutes: number): { amount: number; unit: DurationUnit } {
  if (minutes > 0 && minutes % 60 === 0) return { amount: minutes / 60, unit: "hours" }
  return { amount: minutes, unit: "minutes" }
}

export function toMinutes(amount: number, unit: DurationUnit): number {
  return Math.round(amount * (unit === "hours" ? 60 : 1))
}

/** "1 h 30 min", "2 h", "45 min". Unit words are passed in so callers can translate. */
export function formatDuration(minutes: number, units: { h: string; min: string } = { h: "h", min: "min" }): string {
  const m = Math.max(0, Math.round(minutes))
  const h = Math.floor(m / 60)
  const r = m % 60
  if (h && r) return `${h} ${units.h} ${r} ${units.min}`
  if (h) return `${h} ${units.h}`
  return `${r} ${units.min}`
}

/* ---------- time zones ---------- */

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  } catch {
    return "UTC"
  }
}

export function timeZoneList(extra?: string | null): string[] {
  let list: string[] = []
  try {
    list = (Intl as any).supportedValuesOf("timeZone") as string[]
  } catch {}
  if (!list.length) list = ["UTC", "Europe/Moscow", "Europe/London", "Europe/Paris", "America/New_York", "America/Los_Angeles", "Asia/Shanghai", "Asia/Dubai"]
  if (!list.includes("UTC")) list = ["UTC", ...list]
  if (extra && !list.includes(extra)) list = [extra, ...list]
  return list
}

/** Short zone name at an instant, e.g. "GMT+3" or "EDT". */
export function zoneAbbr(iso: string | Date, zone: string, locale = "en"): string {
  try {
    const parts = new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: "short" }).formatToParts(new Date(iso))
    return parts.find((p) => p.type === "timeZoneName")?.value ?? zone
  } catch {
    return zone
  }
}

/** "Tue, 14 Oct, 15:00 GMT+3". Always includes the zone. */
export function formatInZone(iso: string | Date, zone: string, locale = "en"): string {
  try {
    const d = new Intl.DateTimeFormat(locale, { timeZone: zone, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso))
    return `${d} ${zoneAbbr(iso, zone, locale)}`
  } catch {
    return new Date(iso).toISOString()
  }
}

/** "15:00-16:00 GMT+3" for a slot. */
export function formatTimeRange(startIso: string, endIso: string, zone: string, locale = "en"): string {
  const f = new Intl.DateTimeFormat(locale, { timeZone: zone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
  return `${f.format(new Date(startIso))}–${f.format(new Date(endIso))} ${zoneAbbr(startIso, zone, locale)}`
}

export function formatDateInZone(iso: string | Date, zone: string, locale = "en", opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }): string {
  try {
    return new Intl.DateTimeFormat(locale, { timeZone: zone, ...opts }).format(new Date(iso))
  } catch {
    return String(iso)
  }
}

/** YYYY-MM-DD of an instant in a zone. */
export function dateKeyInZone(iso: string | Date, zone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso))
  } catch {
    return new Date(iso).toISOString().slice(0, 10)
  }
}

export function groupByDate<T extends { start: string }>(items: T[], zone: string): Array<{ date: string; items: T[] }> {
  const map = new Map<string, T[]>()
  for (const it of items) {
    const k = dateKeyInZone(it.start, zone)
    map.set(k, [...(map.get(k) ?? []), it])
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, list]) => ({ date, items: list.sort((a, b) => a.start.localeCompare(b.start)) }))
}

/** True when the two zones show different local times at this instant. */
export function zonesDiffer(iso: string, a: string, b: string): boolean {
  return formatInZone(iso, a, "en") !== formatInZone(iso, b, "en")
}

/* ---------- window ---------- */

export function addDaysISO(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function defaultWindow(zone: string, now = new Date(), days = DEFAULT_WINDOW_DAYS): { start: string; end: string } {
  const start = dateKeyInZone(now, zone)
  return { start, end: addDaysISO(start, days - 1) }
}

export function windowDays(start: string, end: string): number {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1
}

export type WindowIssue = "order" | "too_long" | "empty" | null
export function validateWindow(start: string, end: string): WindowIssue {
  if (!start || !end) return "empty"
  if (end < start) return "order"
  if (windowDays(start, end) > MAX_WINDOW_DAYS) return "too_long"
  return null
}

/* ---------- bookings ---------- */

/** The API refuses completion before the session ends; mirror it so the button can be disabled. */
export function sessionEnded(slotEndIso: string | null | undefined, now = new Date()): boolean {
  if (!slotEndIso) return true
  return new Date(slotEndIso).getTime() <= now.getTime()
}

export function isHttps(url: string): boolean {
  try {
    return new URL(url.trim()).protocol === "https:"
  } catch {
    return false
  }
}
