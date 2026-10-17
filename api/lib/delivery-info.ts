export type ZoneRow = { vendor_id: string; fee: number | string | null; currency: string | null; active?: boolean | null; eta_minutes?: number | null }
export type DeliveryInfo = { delivery_zone_count: number; delivery_fee_from: number | null; delivery_fee_currency: string | null; delivery_eta_min: number | null; delivery_eta_max: number | null }

const NONE: DeliveryInfo = { delivery_zone_count: 0, delivery_fee_from: null, delivery_fee_currency: null, delivery_eta_min: null, delivery_eta_max: null }

/**
 * What a store shows about delivery: the cheapest fee ("from") in the currency most of its zones use, and the range of
 * delivery times across its active zones. A store with no active zones delivers nowhere (pickup only).
 */
export function summarizeZones(rows: ZoneRow[]): Map<string, DeliveryInfo> {
  const byVendor = new Map<string, ZoneRow[]>()
  for (const r of rows) {
    if (r.active === false) continue
    const list = byVendor.get(r.vendor_id) ?? []
    list.push(r)
    byVendor.set(r.vendor_id, list)
  }
  const out = new Map<string, DeliveryInfo>()
  for (const [id, zones] of byVendor) {
    const counts = new Map<string, number>()
    for (const z of zones) counts.set(String(z.currency || ""), (counts.get(String(z.currency || "")) ?? 0) + 1)
    const currency = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] || null
    const fees = zones.filter((z) => String(z.currency || "") === currency && z.fee != null && z.fee !== "").map((z) => Number(z.fee)).filter((n) => Number.isFinite(n) && n >= 0)
    const etas = zones.filter((z) => z.eta_minutes != null).map((z) => Number(z.eta_minutes)).filter((n) => Number.isInteger(n) && n > 0)
    out.set(id, {
      delivery_zone_count: zones.length,
      delivery_fee_from: fees.length ? Math.min(...fees) : null,
      delivery_fee_currency: fees.length ? currency : null,
      delivery_eta_min: etas.length ? Math.min(...etas) : null,
      delivery_eta_max: etas.length ? Math.max(...etas) : null,
    })
  }
  return out
}

export const noDelivery = (): DeliveryInfo => ({ ...NONE })

/** Loads the zones of the given stores. A database without the zones table gives no delivery info rather than an error. */
export async function loadDeliveryInfo(server: { from: (t: string) => any }, vendorIds: string[]): Promise<Map<string, DeliveryInfo>> {
  if (!vendorIds.length) return new Map()
  const { data, error } = await server.from("marketplace_zones").select("vendor_id,fee,currency,active,eta_minutes").in("vendor_id", vendorIds).eq("active", true)
  if (error) return new Map()
  return summarizeZones((data as ZoneRow[]) || [])
}
