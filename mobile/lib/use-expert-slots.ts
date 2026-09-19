import { fetchWithAuth } from "./api"
import { useCachedQuery } from "./use-cached-query"
import type { ExpertSlot } from "./types"

const TTL_MS = 60_000

type ServiceSlots = { slots: ExpertSlot[]; service: { title: string; short_description?: string | null } | null }

async function fetchExpertSlots(serviceId: string): Promise<ServiceSlots> {
  const res = await fetchWithAuth(`/api/expert/services/${encodeURIComponent(serviceId)}/slots`)
  if (!res.ok) throw new Error("Failed to load slots")
  const body = (await res.json()) as {
    slots?: ExpertSlot[]
    service?: { title?: string; short_description?: string | null }
  }
  return {
    slots: body.slots || [],
    service: body.service ? { title: body.service.title || "", short_description: body.service.short_description } : null,
  }
}

/** Open booking slots for one service. Short TTL — availability changes as other users book. */
export function useExpertSlots(serviceId: string | null | undefined) {
  const key = serviceId ? `ciuna_expert_slots_${serviceId}` : null
  return useCachedQuery<ServiceSlots>(key, () => fetchExpertSlots(serviceId as string), { ttlMs: TTL_MS })
}
