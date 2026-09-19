import { fetchWithAuth } from "./api"
import { readCacheSync, writeCache } from "./cache"
import { useCachedQuery } from "./use-cached-query"
import type { HubProduct } from "./types"

const PRODUCT_TTL_MS = 10 * 60_000

export function hubProductCacheKey(productId: string): string {
  return `ciuna_hub_product_${productId}`
}

/** Lets a list screen that already has full product rows make the detail screen instant. */
export function seedHubProductCache(products: HubProduct[]): void {
  for (const p of products) {
    if (p?.id) void writeCache(hubProductCacheKey(p.id), p)
  }
}

async function fetchHubProduct(productId: string): Promise<HubProduct> {
  const res = await fetchWithAuth(`/api/hub/products/${encodeURIComponent(productId)}`)
  if (!res.ok) throw new Error("Product not found")
  const body = (await res.json()) as { product?: HubProduct }
  if (!body.product) throw new Error("Product not found")
  return body.product
}

/** Instant when a catalog/vendor list already seeded this product; otherwise fetches once. */
export function useHubProduct(productId: string | null | undefined) {
  const key = productId ? hubProductCacheKey(productId) : null
  return useCachedQuery<HubProduct>(key, () => fetchHubProduct(productId as string), { ttlMs: PRODUCT_TTL_MS })
}

/** Synchronous peek — lets a screen pass a warm value as the router param fallback if ever needed. */
export function peekHubProduct(productId: string): HubProduct | null {
  return readCacheSync<HubProduct>(hubProductCacheKey(productId))?.value ?? null
}
