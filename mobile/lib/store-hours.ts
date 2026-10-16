import type { HubVendor } from "@/lib/types"

type TFn = (key: string, opts?: Record<string, unknown>) => string

const DAY_INDEX = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 } as const

/** Short weekday name for an API day key, in the viewer's language (2026-10-19 is a Monday). */
export function shortDay(day: keyof typeof DAY_INDEX, locale: string): string {
  return new Date(2026, 9, 19 + DAY_INDEX[day]).toLocaleDateString(locale, { weekday: "short" })
}

export type StoreOpenLine = { text: string; open: boolean }

/**
 * One line about whether a store is open now, or null when it has not set hours (show nothing then).
 * Times are in the store's own time zone, as the API computes them.
 */
export function storeOpenLine(vendor: Pick<HubVendor, "hours_configured" | "is_open" | "opens_at" | "closes_at">, t: TFn, locale: string): StoreOpenLine | null {
  if (!vendor.hours_configured) return null
  if (vendor.is_open) {
    return {
      open: true,
      text: vendor.closes_at
        ? t("hub.store.openUntil", { time: vendor.closes_at, defaultValue: "Open until {{time}}" })
        : t("hub.store.openUntil", { time: "", defaultValue: "Open" }).trim(),
    }
  }
  if (vendor.opens_at) {
    return {
      open: false,
      text: t("hub.store.closedOpens", {
        day: shortDay(vendor.opens_at.day, locale),
        time: vendor.opens_at.time,
        defaultValue: "Closed · opens {{day}} {{time}}",
      }),
    }
  }
  return { open: false, text: t("hub.store.closed", { defaultValue: "Closed" }) }
}
