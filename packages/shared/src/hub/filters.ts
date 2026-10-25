import { RU_CITIES, normalizeRuCity, sameCity } from "../geo/ru-cities"

const norm = (v: string) => v.trim().toLowerCase()

/** True when the store serves the chosen community (or no community is chosen). */
export function vendorServesCommunity(v: { communities?: string[] | null }, community: string | null): boolean {
  if (!community) return true
  return (v.communities || []).includes(community)
}

/** A store is shown for a city when it delivers there, or delivers nowhere at all (pickup only, digital sellers). */
export function vendorServesCity(
  v: { delivery_areas?: { city: string; district?: string }[] | null; delivery_zone_count?: number | null },
  city: string | null,
): boolean {
  if (!city) return true
  const areas = v.delivery_areas
  if (!areas || areas.length === 0) return (v.delivery_zone_count ?? 0) === 0
  return areas.some((a) => sameCity(a.city, city))
}

/** Experts and services: online ones always show; in-person ones show unless their service area names other places. */
export function areaMatches(serviceArea: string | null | undefined, city: string | null): boolean {
  if (!city) return true
  const area = (serviceArea || "").trim()
  if (!area) return true
  const en = normalizeRuCity(city) ?? city
  const ru = RU_CITIES.find((c) => c.en === en)?.ru
  const hay = norm(area)
  return hay.includes(norm(en)) || (ru ? hay.includes(norm(ru)) : false) || hay.includes(norm(city))
}
