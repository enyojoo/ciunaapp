import type { HubServiceLineRow } from "@ciuna/shared"

export function isHubMarketplaceSlug(slug: string): boolean {
  const s = slug.trim().toLowerCase()
  return s === "food" || s === "mart"
}

export function isHubExpertsSlug(slug: string): boolean {
  return slug.trim().toLowerCase() === "experts"
}

export function isHubSendSlug(slug: string): boolean {
  const s = slug.trim().toLowerCase()
  return s === "send" || s === "send-money"
}

/** Expo path for a marketplace/line home. */
export function hubLineHomePath(slug: string): string {
  const s = slug.trim().toLowerCase()
  if (isHubMarketplaceSlug(s)) return `/hub/${s}`
  if (isHubExpertsSlug(s)) return "/experts"
  if (isHubSendSlug(s)) return "/send"
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

function expoPathFromRoutePath(p: string): string {
  const raw = p.trim()
  if (!raw) return ""
  const s = raw.split("?")[0].replace(/\/$/, "") || "/"
  if (s === "/send" || s.startsWith("/send/")) return "/send"
  if (s === "/food" || s.startsWith("/food/") || s === "/hub/food") return "/hub/food"
  if (s === "/mart" || s.startsWith("/mart/") || s === "/hub/mart") return "/hub/mart"
  if (s === "/experts" || s.startsWith("/experts/") || s === "/hub/experts") return "/experts"
  if (raw.startsWith("/hub/")) return raw
  return raw.startsWith("/") ? raw : `/${raw}`
}

export function lineHref(line: HubServiceLineRow): string | null {
  if (line.grid_kind === "external_url") return line.href?.trim() || null
  const slug = String(line.slug || "").trim().toLowerCase()
  if (isHubExpertsSlug(slug)) return "/experts"
  if (isHubSendSlug(slug)) return "/send"
  if (isHubMarketplaceSlug(slug)) return `/hub/${slug}`
  const p = line.route_path?.trim()
  if (p) return expoPathFromRoutePath(p)
  if (line.grid_kind === "hub_category") return hubLineHomePath(line.slug)
  return null
}
