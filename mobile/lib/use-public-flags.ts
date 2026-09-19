import { fetchWithAuth } from "./api"
import { useCachedQuery } from "./use-cached-query"

const KEY = "ciuna_platform_public_flags_v1"
const TTL_MS = 15 * 60_000

type PublicFlags = { yookassaEnabled: boolean }

async function fetchPublicFlags(): Promise<PublicFlags> {
  const res = await fetchWithAuth("/api/platform/public-flags")
  if (!res.ok) throw new Error("Failed to load platform flags")
  const body = (await res.json()) as { yookassaEnabled?: boolean }
  return { yookassaEnabled: Boolean(body.yookassaEnabled) }
}

/** Platform feature flags (e.g. whether YooKassa online payment is enabled) — rarely changes. */
export function usePublicFlags() {
  return useCachedQuery<PublicFlags>(KEY, fetchPublicFlags, { ttlMs: TTL_MS })
}
