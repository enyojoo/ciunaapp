import { fetchWithAuth } from "./api"
import { seedHubProductCache } from "./use-hub-product"
import { useCachedQuery } from "./use-cached-query"
import type { HubProduct, HubVendor } from "./types"

const VENDOR_TTL_MS = 10 * 60_000

type VendorStorefront = { vendor: HubVendor | null; products: HubProduct[] }

async function fetchVendorStorefront(line: string, vendorSlug: string): Promise<VendorStorefront> {
  const [pRes, vRes] = await Promise.all([
    fetchWithAuth(`/api/hub/vendors/${encodeURIComponent(vendorSlug)}/products?service_line=${encodeURIComponent(line)}`),
    fetchWithAuth(`/api/hub/vendors/${encodeURIComponent(vendorSlug)}?service_line=${encodeURIComponent(line)}`),
  ])
  if (!pRes.ok && !vRes.ok) throw new Error("Store not found")
  const body = pRes.ok ? ((await pRes.json()) as { products?: HubProduct[] }) : { products: [] }
  const products = body.products || []
  seedHubProductCache(products)
  let vendor: HubVendor | null = null
  if (vRes.ok) {
    const vBody = (await vRes.json()) as { vendor?: HubVendor | null }
    vendor = vBody.vendor ?? null
  }
  if (!vendor) {
    const fromProduct = products[0]?.vendor
    vendor = fromProduct
      ? {
          id: fromProduct.id,
          name: fromProduct.name,
          slug: fromProduct.slug,
          photo_url: fromProduct.photo_url,
          is_verified: fromProduct.is_verified,
        }
      : null
  }
  if (!vendor && products.length === 0) throw new Error("Store not found")
  return { vendor, products }
}

/** A vendor storefront (profile + product list) — also warms the per-product cache. */
export function useHubVendorStorefront(line: string, vendorSlug: string) {
  const key = line && vendorSlug ? `ciuna_hub_vendor_${line}_${vendorSlug}` : null
  return useCachedQuery<VendorStorefront>(key, () => fetchVendorStorefront(line, vendorSlug), {
    ttlMs: VENDOR_TTL_MS,
  })
}

/** Same product list, keyed just by vendor — for "More from {vendor}" on the product detail screen. */
export function useHubVendorProducts(line: string, vendorSlug: string | undefined) {
  const key = line && vendorSlug ? `ciuna_hub_vendor_${line}_${vendorSlug}` : null
  const { data } = useCachedQuery<VendorStorefront>(
    key,
    () => fetchVendorStorefront(line, vendorSlug as string),
    { ttlMs: VENDOR_TTL_MS },
  )
  return data?.products || []
}
