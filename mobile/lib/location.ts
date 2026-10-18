import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react"
import { RU_CITIES, normalizeRuCity, sameCity } from "@ciuna/shared"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCommunity, vendorServesCommunity } from "@/lib/community"
import { useHubCatalog } from "@/lib/use-hub-catalog"
import type { ExpertCatalogService, ExpertProfile, HubProduct, HubVendor } from "@/lib/types"

/**
 * The shopper's chosen area. It is a city taken from the delivery zones stores have configured (the same city names
 * checkout uses), never free text, so "stores near you" always means "stores that deliver to this city".
 * Device-local; shared by Food, Mart and Experts.
 */
const KEY = "ciuna_location_city"

type State = { city: string | null; ready: boolean }
let state: State = { city: null, ready: false }
let hydrating: Promise<void> | null = null
const listeners = new Set<() => void>()

function set(next: Partial<State>) {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
const snapshot = () => state

function hydrate(): Promise<void> {
  if (state.ready) return Promise.resolve()
  if (!hydrating) {
    hydrating = AsyncStorage.getItem(KEY)
      .then((v) => set({ city: v && v.trim() ? v : null, ready: true }))
      .catch(() => set({ ready: true }))
  }
  return hydrating
}

export async function setLocationCity(city: string | null): Promise<void> {
  set({ city, ready: true })
  try {
    if (city) await AsyncStorage.setItem(KEY, city)
    else await AsyncStorage.removeItem(KEY)
  } catch {
    /* storage unavailable: the choice just won't survive a restart */
  }
}

export function useLocationCity(): { city: string | null; ready: boolean; setCity: (city: string | null) => Promise<void> } {
  useEffect(() => {
    void hydrate()
  }, [])
  const s = useSyncExternalStore(subscribe, snapshot, snapshot)
  return { city: s.city, ready: s.ready, setCity: setLocationCity }
}

const norm = (v: string) => v.trim().toLowerCase()

/** Cities any Food or Mart store delivers to (canonical English names for listed cities), A to Z. */
export function useDeliveryCities(): string[] {
  const food = useHubCatalog("food", true).data
  const mart = useHubCatalog("mart", true).data
  return useMemo(() => {
    const seen = new Map<string, string>()
    for (const v of [...(food?.vendors || []), ...(mart?.vendors || [])])
      for (const a of v.delivery_areas || []) {
        const name = normalizeRuCity(a.city) ?? a.city.trim()
        if (name && !seen.has(norm(name))) seen.set(norm(name), name)
      }
    return [...seen.values()].sort((a, b) => a.localeCompare(b))
  }, [food, mart])
}

/** A store is shown for a city when it delivers there, or delivers nowhere at all (pickup only, digital sellers). */
export function vendorServesCity(v: Pick<HubVendor, "delivery_areas" | "delivery_zone_count">, city: string | null): boolean {
  if (!city) return true
  const areas = v.delivery_areas
  if (!areas || areas.length === 0) return (v.delivery_zone_count ?? 0) === 0
  return areas.some((a) => sameCity(a.city, city))
}

/**
 * Stores and their products narrowed to the chosen city and community. A city keeps stores that deliver there, plus
 * pickup-only and digital sellers; a community keeps only stores that serve it, so digital items without a store drop out.
 */
export function useLocationFilter(vendors: HubVendor[], products: HubProduct[]) {
  const { city } = useLocationCity()
  const { community } = useCommunity()
  return useMemo(() => {
    if (!city && !community) return { city, community, vendors, products }
    const ok = new Set(vendors.filter((v) => vendorServesCity(v, city) && vendorServesCommunity(v, community)).map((v) => v.id))
    const known = new Set(vendors.map((v) => v.id))
    return {
      city,
      community,
      vendors: vendors.filter((v) => ok.has(v.id)),
      products: products.filter((p) => (p.vendor_id ? ok.has(p.vendor_id) || (!known.has(p.vendor_id) && !community) : !community)),
    }
  }, [city, community, vendors, products])
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

/** Experts and their services for the chosen city. A service is in person when its fulfilment is not online-only. */
export function useExpertAreaFilter(profiles: ExpertProfile[], services: ExpertCatalogService[]) {
  const { city } = useLocationCity()
  return useMemo(() => {
    if (!city) return { city, profiles, services }
    const byId = new Map(profiles.map((p) => [p.id, p]))
    return {
      city,
      profiles: profiles.filter((p) => areaMatches(p.service_area, city)),
      services: services.filter((s) => {
        if (s.fulfillment_type === "online" || !s.fulfillment_type) return true
        const p = byId.get(s.expert?.id)
        return !p || areaMatches(p.service_area, city)
      }),
    }
  }, [city, profiles, services])
}
