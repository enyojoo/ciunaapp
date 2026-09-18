import { addDays, addMinutes, parseISO } from "date-fns"
import { formatInTimeZone, toDate } from "date-fns-tz"

export type WeeklyRuleInput = {
  day_of_week: number
  local_start_time: string
  local_end_time: string
  sort_order: number
}

/** Civil date in `timeZone` → JS weekday 0=Sun … 6=Sat (matches `expert_service_weekly_rules.day_of_week`). */
export function jsDowFromZonedNoon(dateStr: string, timeZone: string): number {
  const noon = toDate(`${dateStr} 12:00:00`, { timeZone })
  const iso = Number(formatInTimeZone(noon, timeZone, "i"))
  if (!Number.isFinite(iso) || iso < 1 || iso > 7) return 0
  return iso === 7 ? 0 : iso
}

function padTimePart(t: string): string {
  const s = t.trim()
  if (!s) return "00:00:00"
  if (s.length <= 5) return `${s}:00`
  return s
}

function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart
}

/**
 * Builds UTC slot_start/slot_end pairs from a weekly schedule + window.
 * Skips slots that start in the past or overlap any booked interval.
 */
export function computeMaterializedSlots(params: {
  windowStartDate: string
  windowEndDate: string
  timeZone: string
  durationMinutes: number
  weeklyRules: WeeklyRuleInput[]
  bookedIntervals: { start: Date; end: Date }[]
  now: Date
}): { slot_start: string; slot_end: string }[] {
  const { windowStartDate, windowEndDate, timeZone, durationMinutes, weeklyRules, now } = params
  if (durationMinutes <= 0) return []

  const start = parseISO(`${windowStartDate}T12:00:00.000Z`)
  const last = parseISO(`${windowEndDate}T12:00:00.000Z`)
  if (start > last) return []

  const todayStr = formatInTimeZone(now, timeZone, "yyyy-MM-dd")
  const rulesByDow = new Map<number, WeeklyRuleInput[]>()
  for (const r of weeklyRules) {
    const d = Math.floor(Number(r.day_of_week))
    if (d < 0 || d > 6) continue
    const list = rulesByDow.get(d) ?? []
    list.push(r)
    rulesByDow.set(d, list)
  }
  for (const [, list] of rulesByDow) {
    list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }

  const out: { slot_start: string; slot_end: string }[] = []

  for (let cur = start; cur <= last; cur = addDays(cur, 1)) {
    const dateStr = formatInTimeZone(cur, timeZone, "yyyy-MM-dd")
    if (dateStr < todayStr) continue

    const dow = jsDowFromZonedNoon(dateStr, timeZone)
    const rules = rulesByDow.get(dow) ?? []
    for (const rule of rules) {
      const ls = padTimePart(rule.local_start_time)
      const le = padTimePart(rule.local_end_time)
      const rangeStart = toDate(`${dateStr} ${ls}`, { timeZone })
      const rangeEnd = toDate(`${dateStr} ${le}`, { timeZone })
      if (!(rangeEnd > rangeStart)) continue

      let slotStart = rangeStart
      while (true) {
        const slotEnd = addMinutes(slotStart, durationMinutes)
        if (slotEnd > rangeEnd) break
        if (slotStart <= now) {
          slotStart = addMinutes(slotStart, durationMinutes)
          continue
        }
        let blocked = false
        for (const b of params.bookedIntervals) {
          if (intervalsOverlap(slotStart, slotEnd, b.start, b.end)) {
            blocked = true
            break
          }
        }
        if (!blocked) {
          out.push({ slot_start: slotStart.toISOString(), slot_end: slotEnd.toISOString() })
        }
        slotStart = addMinutes(slotStart, durationMinutes)
      }
    }
  }

  out.sort((a, b) => a.slot_start.localeCompare(b.slot_start))
  return out
}
