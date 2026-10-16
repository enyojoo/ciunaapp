import * as React from "react"
import { useT } from "@/lib/i18n"

/** Locale-aware short date, e.g. "16 Oct 2026". Empty for missing values. */
export function useDate() {
  const { locale } = useT()
  return React.useCallback((value: string | null | undefined) => {
    if (!value) return ""
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ""
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(d)
  }, [locale])
}

export const PAYOUT_STATUS_KEY: Record<string, string> = { requested: "earnings.payout.status.requested", approved: "earnings.payout.status.approved", paid: "earnings.payout.status.paid", rejected: "earnings.payout.status.rejected", cancelled: "earnings.payout.status.cancelled" }
// "requested" is not in the shared tone map, so map it onto the amber word.
export const PAYOUT_STATUS_TONE_WORD: Record<string, string> = { requested: "pending", approved: "pending", paid: "paid", rejected: "rejected", cancelled: "cancelled" }
export const EARNING_STATUS_TONE_WORD: Record<string, string> = { pending: "pending", available: "completed", reversed: "cancelled" }
