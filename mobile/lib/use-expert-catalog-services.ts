import { apiFetch } from "./api"
import { useCachedQuery } from "./use-cached-query"
import type { ExpertCatalogService } from "./types"

const KEY = "ciuna_expert_catalog_services_v1"
const TTL_MS = 10 * 60_000

async function fetchExpertCatalogServices(): Promise<ExpertCatalogService[]> {
  const res = await apiFetch("/api/expert/catalog-services")
  if (!res.ok) throw new Error("Failed to load services")
  const body = (await res.json()) as { services?: ExpertCatalogService[] }
  return body.services || []
}

/** Every bookable service across all experts, with the owning expert embedded — the Experts directory grid. */
export function useExpertCatalogServices() {
  return useCachedQuery<ExpertCatalogService[]>(KEY, fetchExpertCatalogServices, { ttlMs: TTL_MS })
}
