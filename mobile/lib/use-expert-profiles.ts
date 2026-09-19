import { apiFetch } from "./api"
import { useCachedQuery } from "./use-cached-query"
import type { ExpertProfile } from "./types"

const KEY = "ciuna_expert_profiles_v1"
const TTL_MS = 10 * 60_000

async function fetchExpertProfiles(): Promise<ExpertProfile[]> {
  const res = await apiFetch("/api/expert/profiles")
  if (!res.ok) throw new Error("Failed to load experts")
  const body = (await res.json()) as { profiles?: ExpertProfile[] }
  return body.profiles || []
}

/** Published expert profiles — shared by the Experts directory and the "All experts" browse screen. */
export function useExpertProfiles() {
  return useCachedQuery<ExpertProfile[]>(KEY, fetchExpertProfiles, { ttlMs: TTL_MS })
}
