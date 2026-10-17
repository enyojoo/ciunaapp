/** "09:42" for 582 seconds left; "00:00" once the time is up. Never negative. */
export function formatCountdown(msLeft: number): string {
  const s = Math.max(0, Math.floor(msLeft / 1000))
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}

/** Milliseconds until an ISO time, or null when there is no (valid) deadline. */
export function msUntil(iso: string | null | undefined, now = Date.now()): number | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  return Number.isFinite(t) ? t - now : null
}
