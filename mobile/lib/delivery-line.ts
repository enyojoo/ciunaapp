import { formatCardPrice } from "@/lib/money"

type TFn = (key: string, opts?: Record<string, unknown>) => string
type Info = { delivery_zone_count?: number; delivery_fee_from?: number | null; delivery_fee_currency?: string | null; delivery_eta_min?: number | null; delivery_eta_max?: number | null }

/** One line about delivery for a store ("Delivery from ₽100 · 30–45 min", "Pickup only"), or null when the API did not say. */
export function deliveryLine(v: Info | null | undefined, t: TFn): string | null {
  if (!v || v.delivery_zone_count == null) return null
  if (v.delivery_zone_count === 0) return t("hub.store.pickupOnly", { defaultValue: "Pickup only" })
  const parts: string[] = []
  if (v.delivery_fee_from != null && v.delivery_fee_currency) {
    parts.push(v.delivery_fee_from === 0 ? t("hub.store.deliveryFree", { defaultValue: "Free delivery" }) : t("hub.store.deliveryFrom", { fee: formatCardPrice(v.delivery_fee_from, v.delivery_fee_currency), defaultValue: "Delivery from {{fee}}" }))
  } else {
    parts.push(t("hub.store.delivers", { defaultValue: "Delivers" }))
  }
  if (v.delivery_eta_min != null) {
    const max = v.delivery_eta_max
    parts.push(max != null && max !== v.delivery_eta_min ? t("hub.store.etaRange", { min: v.delivery_eta_min, max, defaultValue: "{{min}}–{{max}} min" }) : t("hub.store.eta", { min: v.delivery_eta_min, defaultValue: "{{min}} min" }))
  }
  return parts.join(" · ")
}

/** True when stores loaded but none of them delivers anywhere (every one is pickup only). */
export function noStoreDelivers(vendors: Info[]): boolean {
  return vendors.length > 0 && vendors.every((v) => v.delivery_zone_count === 0)
}
