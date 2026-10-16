"use client"
import * as React from "react"
import { useT } from "@/lib/i18n"
import { browserTimeZone, formatDateInZone, formatTimeRange, zoneAbbr } from "./logic"
import { intlLocale } from "./shared"

/** Session time in the booking's own zone, plus the seller's device zone when it differs. Always names the zone. */
export function BookingTime({ slot, compact }: { slot: { start: string; end: string; timezone: string | null } | null; compact?: boolean }) {
  const { t, locale } = useT()
  const loc = intlLocale(locale)
  const [mine, setMine] = React.useState("UTC")
  React.useEffect(() => setMine(browserTimeZone()), [])
  if (!slot) return <span className="text-sm text-muted">{t("expert.bookings.no_slot")}</span>
  const zone = slot.timezone || mine
  const same = zoneAbbr(slot.start, zone, loc) === zoneAbbr(slot.start, mine, loc) && formatTimeRange(slot.start, slot.end, zone, loc) === formatTimeRange(slot.start, slot.end, mine, loc) && formatDateInZone(slot.start, zone, loc) === formatDateInZone(slot.start, mine, loc)
  const line = (z: string) => `${formatDateInZone(slot.start, z, loc, { weekday: "short", day: "numeric", month: "short" })}, ${formatTimeRange(slot.start, slot.end, z, loc)}`
  if (compact) {
    return (
      <div className="text-sm">
        <p className="font-medium tabular-nums">{line(zone)}</p>
        {!same ? <p className="text-muted tabular-nums">{t("expert.bookings.yours")}: {line(mine)}</p> : null}
      </div>
    )
  }
  return (
    <dl className="space-y-2 text-[15px]">
      <div>
        <dt className="text-sm text-muted">{t("expert.bookings.session_time", { zone })}</dt>
        <dd className="font-medium tabular-nums">{line(zone)}</dd>
      </div>
      {!same ? (
        <div>
          <dt className="text-sm text-muted">{t("expert.bookings.your_time", { zone: mine })}</dt>
          <dd className="font-medium tabular-nums">{line(mine)}</dd>
        </div>
      ) : null}
    </dl>
  )
}
