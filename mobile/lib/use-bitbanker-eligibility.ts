import { fetchWithAuth } from "./api"
import { useCachedQuery } from "./use-cached-query"

export type BitbankerEligibility = {
  status: string
  isVerifiedForSbp: boolean
  clientId: string | null
}

const TTL_MS = 2 * 60_000

async function fetchEligibility(): Promise<BitbankerEligibility> {
  const res = await fetchWithAuth("/api/bitbanker/eligibility")
  if (!res.ok) {
    if (res.status === 503) {
      return { status: "unconfigured", isVerifiedForSbp: false, clientId: null }
    }
    throw new Error("Failed to load verification status")
  }
  return (await res.json()) as BitbankerEligibility
}

export function useBitbankerEligibility(userId: string | undefined) {
  const key = userId ? `bitbanker-eligibility-${userId}` : null
  return useCachedQuery<BitbankerEligibility>(key, fetchEligibility, { ttlMs: TTL_MS })
}
