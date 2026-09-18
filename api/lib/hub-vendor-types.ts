import type { HubProductVendorSummary } from "@/lib/hub-types"

export interface HubVendorRow {
  id: string
  service_line_slug: string
  name: string
  slug: string
  photo_url: string | null
  short_bio: string | null
  /** Shown on the hub vendor storefront (e.g. city or “Online”). */
  location?: string | null
  is_published: boolean
  /** Ciuna-verified vendor badge on product cards (optional until DB column exists). */
  is_verified?: boolean | null
  created_at: string
  updated_at: string
}

/** Pure helper for client UIs: build product-card vendor chip data from a `hub_vendors` row. */
export function hubVendorRowToProductSummary(
  v: HubVendorRow,
  lineFallback: string,
): HubProductVendorSummary {
  const line = String(v.service_line_slug || "").trim().toLowerCase() || String(lineFallback || "").trim().toLowerCase()
  return {
    id: v.id,
    name: v.name,
    slug: v.slug,
    service_line_slug: line,
    photo_url: v.photo_url,
    is_verified: Boolean(v.is_verified),
  }
}
