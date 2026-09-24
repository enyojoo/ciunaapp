import { useEffect } from "react"
import { subscribeOfficeConfigRevalidate } from "./config-revalidate-bus"
import { fetchWithAuth } from "./api"
import { useCachedQuery } from "./use-cached-query"

const KEY = "ciuna_platform_public_flags_v2"
const TTL_MS = 60_000

type PublicFlags = { yookassaEnabled: boolean }

async function fetchPublicFlags(): Promise<PublicFlags> {
  const res = await fetchWithAuth("/api/platform/public-flags")
  if (!res.ok) throw new Error("Failed to load platform flags")
  const body = (await res.json()) as { yookassaEnabled?: boolean }
  return { yookassaEnabled: Boolean(body.yookassaEnabled) }
}

/** Platform feature flags (e.g. whether YooKassa online payment is enabled) — rarely changes. */
export function usePublicFlags() {
  const query = useCachedQuery<PublicFlags>(KEY, fetchPublicFlags, { ttlMs: TTL_MS })
  useEffect(
    () => subscribeOfficeConfigRevalidate("publicFlags", () => void query.revalidate()),
    [query.revalidate],
  )
  return query
}
