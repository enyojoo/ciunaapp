import type { HubProductRow, HubProductVendorSummary } from "@/lib/hub-types"
import { createServerClient } from "@/lib/supabase"

type HubServer = ReturnType<typeof createServerClient>

function mapVendorRow(v: Record<string, unknown>): HubProductVendorSummary {
  return {
    id: String(v.id),
    name: String(v.name || ""),
    slug: String(v.slug || ""),
    service_line_slug: String(v.service_line_slug || ""),
    photo_url: v.photo_url != null ? String(v.photo_url) : null,
    is_verified: Boolean(v.is_verified),
  }
}

export function hubVendorDbRowToProductSummary(v: Record<string, unknown>): HubProductVendorSummary {
  return mapVendorRow(v)
}

/** Attach `vendor` to each product that has `vendor_id`, for storefront links and profile UI. */
export async function enrichHubProductsWithVendors(server: HubServer, products: HubProductRow[]): Promise<HubProductRow[]> {
  if (!products.length) return products
  const ids = [...new Set(products.map((p) => p.vendor_id).filter(Boolean))] as string[]
  if (!ids.length) return products

  const { data: vendors, error } = await server.from("hub_vendors").select("*").in("id", ids)
  if (error) {
    console.error("enrichHubProductsWithVendors", error)
    return products
  }

  const byId = new Map<string, HubProductVendorSummary>()
  for (const raw of vendors || []) {
    const v = raw as Record<string, unknown>
    const id = String(v.id || "")
    if (!id) continue
    byId.set(id, mapVendorRow(v))
  }

  return products.map((p) => {
    const vid = p.vendor_id != null ? String(p.vendor_id).trim() : ""
    const vendor = vid && byId.get(vid) ? byId.get(vid)! : undefined
    return vendor ? { ...p, vendor } : { ...p, vendor: undefined }
  })
}
