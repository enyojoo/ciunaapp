/**
 * ISO date strings formatted with Intl using the active UI locale (i18next).
 */

export function formatLocaleDateShort(dateString: string, locale: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/** Date + time, e.g. transaction detail header and timeline. */
export function formatLocaleDateTimeLine(dateString: string, locale: string): string {
  const date = new Date(dateString)
  const datePart = date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const timePart = date.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
  })
  return `${datePart} • ${timePart}`
}

/** Medium date + short time (e.g. referral reward window). */
export function formatLocaleDateTimeMedium(dateString: string, locale: string): string {
  const date = new Date(dateString)
  return date.toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}
