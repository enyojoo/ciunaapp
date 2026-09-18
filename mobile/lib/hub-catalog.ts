import type { HubProduct, HubVendor } from "@/lib/types"

export function sortHubCatalogProducts(list: HubProduct[]): HubProduct[] {
  return [...list].sort((a, b) => {
    const fa = a.is_featured ? 1 : 0
    const fb = b.is_featured ? 1 : 0
    if (fb !== fa) return fb - fa
    const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0
    const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0
    return tb - ta
  })
}

export function catalogCategories(products: HubProduct[], selected?: string): string[] {
  const set = new Set<string>()
  for (const p of products) {
    const c = (p.category || "").trim()
    if (c) set.add(c)
  }
  const sorted = [...set].sort((a, b) => a.localeCompare(b))
  const sel = (selected || "").trim()
  if (sel && !sorted.some((c) => c.toLowerCase() === sel.toLowerCase())) sorted.unshift(sel)
  return sorted
}

export function filterCatalogByCategory(products: HubProduct[], selected: string): HubProduct[] {
  const q = selected.trim().toLowerCase()
  if (!q) return products
  return products.filter((p) => (p.category || "").trim().toLowerCase() === q)
}

export function attachVendorsToProducts(products: HubProduct[], vendors: HubVendor[], lineSlug: string): HubProduct[] {
  const byId = new Map(vendors.map((v) => [v.id, v]))
  return products.map((p) => {
    if (p.vendor) return p
    const vid = p.vendor_id != null ? String(p.vendor_id).trim() : ""
    if (!vid) return p
    const row = byId.get(vid)
    if (!row) return p
    return {
      ...p,
      vendor: {
        id: row.id,
        name: row.name,
        slug: row.slug,
        photo_url: row.photo_url,
        is_verified: row.is_verified,
        service_line_slug: row.service_line_slug || lineSlug,
      },
    }
  })
}
