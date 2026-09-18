/** URL-safe slug for hub service lines and hub product categories (single convention). */
export function hubCategorySlug(label: string): string {
  return String(label || "")
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function categoryMatchesSlug(category: string, slug: string): boolean {
  return hubCategorySlug(category) === String(slug || "").trim().toLowerCase()
}

/** When `service_line_slug` is set on the product, use it; otherwise fall back to category slug (legacy). */
export function hubProductBelongsToServiceLine(
  product: { category?: string | null; service_line_slug?: string | null },
  lineSlug: string,
): boolean {
  const line = String(lineSlug || "").trim().toLowerCase()
  if (!line) return false
  const stored = product.service_line_slug != null ? String(product.service_line_slug).trim().toLowerCase() : ""
  if (stored === "food" || stored === "mart") return stored === line
  return categoryMatchesSlug(String(product.category || ""), line)
}

/** When the product category maps to the Food or Mart marketplace line; otherwise null. */
export function hubMarketplaceLineFromCategory(category: string): "food" | "mart" | null {
  const s = hubCategorySlug(category)
  if (s === "food" || s === "mart") return s
  return null
}

/** Validates marketplace product cache rows belong to `lineSlug` (food vs mart mix-ups). */
export function hubCachedProductsMatchServiceLine(
  products: { category?: string | null; service_line_slug?: string | null }[],
  lineSlug: string,
): boolean {
  if (products.length === 0) return true
  const line = String(lineSlug || "").trim().toLowerCase()
  if (!line) return false
  return products.every((p) => hubProductBelongsToServiceLine(p, line))
}

/**
 * Whether a vendor row belongs to a marketplace line (`food` / `mart`).
 * Rows without `service_line_slug` are treated as belonging to the current line — they come from
 * this line's API/cache bucket (legacy JSON omitted the field; strict equality would hide every row).
 */
export function hubVendorBelongsToServiceLine(
  v: { service_line_slug?: string | null },
  lineSlug: string,
): boolean {
  const line = String(lineSlug || "").trim().toLowerCase()
  if (line !== "food" && line !== "mart") return false
  const raw = v.service_line_slug
  const stored = raw != null && String(raw).trim() !== "" ? String(raw).trim().toLowerCase() : ""
  if (stored === "food" || stored === "mart") return stored === line
  return true
}

/** Validates vendor directory cache rows match `lineSlug`. */
export function hubCachedVendorsMatchServiceLine(
  vendors: { service_line_slug?: string | null }[],
  lineSlug: string,
): boolean {
  if (vendors.length === 0) return true
  const line = String(lineSlug || "").trim().toLowerCase()
  if (!line) return false
  return vendors.every((v) => hubVendorBelongsToServiceLine(v, line))
}
