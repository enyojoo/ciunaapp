import { fetchWithAuth } from "./api"
import { seedHubProductCache } from "./use-hub-product"
import { useCachedQuery } from "./use-cached-query"
import type { HubProduct, HubVendor } from "./types"

const CATALOG_TTL_MS = 10 * 60_000

type Catalog = { products: HubProduct[]; vendors: HubVendor[] }

async function fetchCatalog(line: string, marketplace: boolean): Promise<Catalog> {
  const [pRes, vRes] = await Promise.all([
    fetchWithAuth(`/api/hub/products?service_line=${encodeURIComponent(line)}`),
    marketplace ? fetchWithAuth(`/api/hub/vendors?service_line=${encodeURIComponent(line)}`) : Promise.resolve(null),
  ])
  if (!pRes.ok) throw new Error("Failed to load catalog")
  const pBody = (await pRes.json()) as { products?: HubProduct[] }
  const products = pBody.products || []
  seedHubProductCache(products)
  let vendors: HubVendor[] = []
  if (vRes?.ok) {
    const vBody = (await vRes.json()) as { vendors?: HubVendor[] }
    vendors = vBody.vendors || []
  }
  return { products, vendors }
}

/** A service line's catalog (Food/Mart products + vendors) — also warms the per-product cache. */
export function useHubCatalog(line: string, marketplace: boolean) {
  const key = line ? `ciuna_hub_catalog_${line}` : null
  return useCachedQuery<Catalog>(key, () => fetchCatalog(line, marketplace), { ttlMs: CATALOG_TTL_MS })
}
