export type Quiet = { start: number | null; end: number | null; tz: string | null }

/** The hour (0 to 23) it is right now in a time zone; UTC when the zone is missing or unknown. */
export function localHour(now: Date, tz: string | null | undefined): number {
  try {
    const h = new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: tz || "UTC" }).formatToParts(now).find((p) => p.type === "hour")?.value
    const n = Number(h)
    return Number.isInteger(n) ? n % 24 : now.getUTCHours()
  } catch {
    return now.getUTCHours()
  }
}

/** True when pushes should be held: quiet hours are set and the person's local time is inside them. A window may wrap midnight (22 to 7). */
export function inQuietHours(now: Date, q: Quiet | null | undefined): boolean {
  if (!q || q.start == null || q.end == null || q.start === q.end) return false
  const h = localHour(now, q.tz)
  return q.start < q.end ? h >= q.start && h < q.end : h >= q.start || h < q.end
}

/** Reads and checks what the app sent: { enabled, start, end, tz }. Returns the columns to store. */
export function parseQuiet(input: any): { quiet_start: number | null; quiet_end: number | null; quiet_tz: string | null } | null {
  if (!input || typeof input !== "object") return null
  if (input.enabled === false) return { quiet_start: null, quiet_end: null, quiet_tz: null }
  const start = Number(input.start)
  const end = Number(input.end)
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start > 23 || end < 0 || end > 23 || start === end) return null
  let tz: string | null = null
  if (typeof input.tz === "string" && input.tz.length <= 64) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: input.tz })
      tz = input.tz
    } catch {
      tz = null
    }
  }
  return { quiet_start: start, quiet_end: end, quiet_tz: tz }
}
