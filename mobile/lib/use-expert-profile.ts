import { apiFetch } from "./api"
import { useCachedQuery } from "./use-cached-query"
import type { ExpertProfile, ExpertService } from "./types"

const TTL_MS = 10 * 60_000
export const EXPERT_NOT_FOUND = "Expert not found"

type ExpertProfileDetail = { profile: ExpertProfile; services: ExpertService[] }

async function fetchExpertProfile(slugOrId: string): Promise<ExpertProfileDetail> {
  const res = await apiFetch(`/api/expert/profiles/${encodeURIComponent(slugOrId)}`)
  if (res.status === 404) throw new Error(EXPERT_NOT_FOUND)
  if (!res.ok) throw new Error("Failed to load expert")
  const body = (await res.json()) as { profile?: ExpertProfile; services?: ExpertService[] }
  if (!body.profile) throw new Error(EXPERT_NOT_FOUND)
  return { profile: body.profile, services: body.services || [] }
}

/** A single expert's profile + bookable services, keyed by slug (or id). */
export function useExpertProfile(slugOrId: string | null | undefined) {
  const key = slugOrId ? `ciuna_expert_profile_${slugOrId}` : null
  return useCachedQuery<ExpertProfileDetail>(key, () => fetchExpertProfile(slugOrId as string), { ttlMs: TTL_MS })
}
