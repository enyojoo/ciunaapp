/** Food/Mart/Experts live under `/{slug}` (no `/hub` prefix). Other hub lines stay `/hub/{slug}`. */

export const HUB_MARKETPLACE_LINE_SLUGS = ["food", "mart"] as const
export type HubMarketplaceLineSlug = (typeof HUB_MARKETPLACE_LINE_SLUGS)[number]

export function isHubExpertsLineSlug(slug: string): boolean {
  return slug.trim().toLowerCase() === "experts"
}

export function isHubMarketplaceLineSlug(slug: string): boolean {
  const s = slug.trim().toLowerCase()
  return s === "food" || s === "mart"
}

/** Line home: `/food`, `/mart`, `/experts`, or `/hub/{slug}` for other hub_category lines. */
export function hubLineHomePath(slug: string): string {
  const s = slug.trim().toLowerCase()
  if (isHubMarketplaceLineSlug(s)) return `/${s}`
  if (isHubExpertsLineSlug(s)) return "/experts"
  return `/hub/${s}`
}

export function hubMarketplaceStoresPath(lineSlug: string): string {
  return `${hubLineHomePath(lineSlug)}/stores`
}

export function hubMarketplaceVendorPath(lineSlug: string, vendorSlug: string): string {
  return `${hubLineHomePath(lineSlug)}/v/${encodeURIComponent(vendorSlug)}`
}

export function hubMarketplaceCheckoutPath(lineSlug: string, productId: string): string {
  return `${hubLineHomePath(lineSlug)}/checkout/${encodeURIComponent(productId)}`
}

/** Checkout for non–Food/Mart hub catalog products. */
export function hubGenericCheckoutPath(productId: string): string {
  return `/hub/checkout/${encodeURIComponent(productId)}`
}

/** App header "back" from current URL: `/food`, `/mart`, or `/hub`. */
export function hubCheckoutBackHrefFromPathname(pathname: string): string {
  const p = String(pathname || "").toLowerCase()
  if (p.startsWith("/food/") || p === "/food") return "/food"
  if (p.startsWith("/mart/") || p === "/mart") return "/mart"
  if (p.startsWith("/experts/") || p === "/experts") return "/experts"
  return "/hub"
}
