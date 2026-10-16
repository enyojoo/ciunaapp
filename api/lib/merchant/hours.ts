import { assert } from "./errors"

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const
export type Day = (typeof DAYS)[number]
export type Range = { open: string; close: string }
/** A missing day is closed. An empty schedule means "not set": the store is never shown as closed. */
export type Schedule = Partial<Record<Day, Range[]>>

const TIME = /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/
const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== "string" || tz.length < 3 || tz.length > 64) return false
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/**
 * Validates and cleans a weekly schedule from a seller. A shift that runs past midnight is entered
 * as two ranges: until 24:00 on one day, and from 00:00 on the next.
 */
export function normalizeSchedule(input: unknown): Schedule {
  if (input == null || (typeof input === "object" && Object.keys(input as object).length === 0)) return {}
  assert(typeof input === "object" && !Array.isArray(input), "HOURS_INVALID")
  const out: Schedule = {}
  for (const [day, ranges] of Object.entries(input as Record<string, unknown>)) {
    assert((DAYS as readonly string[]).includes(day), "HOURS_INVALID")
    assert(Array.isArray(ranges) && ranges.length <= 3, "HOURS_INVALID")
    const clean: Range[] = ranges.map((r: any) => {
      assert(r && TIME.test(String(r.open)) && TIME.test(String(r.close)), "HOURS_INVALID")
      assert(toMinutes(r.open) < toMinutes(r.close), "HOURS_INVALID")
      return { open: String(r.open), close: String(r.close) }
    })
    clean.sort((a, b) => toMinutes(a.open) - toMinutes(b.open))
    for (let i = 1; i < clean.length; i++) assert(toMinutes(clean[i].open) >= toMinutes(clean[i - 1].close), "HOURS_OVERLAP")
    if (clean.length) out[day as Day] = clean
  }
  return out
}

export type OpenState = {
  /** False when the store has not set hours: show nothing. */
  configured: boolean
  open: boolean
  /** Next opening, in the store's own time zone, when it is closed now. */
  opensAt?: { day: Day; time: string }
  /** Closing time today, when it is open now. */
  closesAt?: string
}

function localParts(now: Date, timeZone: string): { day: Day; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now)
  const get = (t: string) => parts.find((p) => p.type === t)?.value || ""
  const day = get("weekday").toLowerCase().slice(0, 3) as Day
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) }
}

export function openState(schedule: Schedule | null | undefined, timeZone: string, now: Date = new Date()): OpenState {
  const sched = schedule || {}
  if (!Object.values(sched).some((r) => r && r.length)) return { configured: false, open: true }
  const tz = isValidTimeZone(timeZone) ? timeZone : "UTC"
  const { day, minutes } = localParts(now, tz)
  const today = sched[day] || []
  const current = today.find((r) => toMinutes(r.open) <= minutes && minutes < toMinutes(r.close))
  if (current) return { configured: true, open: true, closesAt: current.close }
  const later = today.find((r) => toMinutes(r.open) > minutes)
  if (later) return { configured: true, open: false, opensAt: { day, time: later.open } }
  const start = DAYS.indexOf(day)
  for (let i = 1; i <= 7; i++) {
    const d = DAYS[(start + i) % 7]
    const first = sched[d]?.[0]
    if (first) return { configured: true, open: false, opensAt: { day: d, time: first.open } }
  }
  return { configured: true, open: false }
}
