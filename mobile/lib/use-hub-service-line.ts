import { useEffect } from "react"
import { findHubServiceLineBySlug, type HubServiceLineRow } from "@ciuna/shared"
import { fetchWithAuth } from "@/lib/api"
import { subscribeOfficeConfigRevalidate } from "./config-revalidate-bus"
import { useCachedQuery } from "./use-cached-query"

/** Shared across every slug — one cached fetch of the full list, not one per caller. */
const SERVICE_LINES_CACHE_KEY = "ciuna_hub_service_lines_v2"
const SERVICE_LINES_TTL_MS = 60_000

async function fetchServiceLines(): Promise<HubServiceLineRow[]> {
  const res = await fetchWithAuth("/api/hub/service-lines")
  if (!res.ok) throw new Error("Failed to load service lines")
  const data = (await res.json()) as { serviceLines?: HubServiceLineRow[] }
  return data.serviceLines || []
}

/** The full Office Hub Services grid (Home screen) — one shared cache entry. */
export function useHubServiceLines() {
  const query = useCachedQuery<HubServiceLineRow[]>(SERVICE_LINES_CACHE_KEY, fetchServiceLines, {
    ttlMs: SERVICE_LINES_TTL_MS,
  })
  useEffect(
    () => subscribeOfficeConfigRevalidate("hubServiceLines", () => void query.revalidate()),
    [query.revalidate],
  )
  return query
}

/** Office Hub Services row for a route slug — reads the same cached list above. */
export function useHubServiceLine(slug: string): HubServiceLineRow | null {
  const key = slug.trim() ? SERVICE_LINES_CACHE_KEY : null
  const { data } = useCachedQuery<HubServiceLineRow[]>(key, fetchServiceLines, { ttlMs: SERVICE_LINES_TTL_MS })
  if (!data) return null
  return findHubServiceLineBySlug(data, slug.trim())
}
