/** A date and time that always names its time zone (for example "Oct 16, 2026, 2:14 PM GMT+3"). Falls back to the raw text. */
export function formatWhenZone(iso: string | null | undefined, locale: string, zone?: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  try {
    return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short", ...(zone ? { timeZone: zone } : {}) }).format(d)
  } catch {
    return d.toLocaleString()
  }
}

/** Time only, with its zone (timeline rows). */
export function formatTimeZone(iso: string | null | undefined, locale: string, zone?: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  try {
    return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZoneName: "short", ...(zone ? { timeZone: zone } : {}) }).format(d)
  } catch {
    return d.toLocaleTimeString()
  }
}
