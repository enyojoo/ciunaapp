export type HubServiceLineGridKind = "hub_category" | "app_link" | "external_url"

export interface HubServiceLineRow {
  id: string
  slug: string
  title: string
  short_description: string | null
  sort_order: number
  is_enabled: boolean
  icon_url: string | null
  icon_key: string | null
  grid_kind: HubServiceLineGridKind
  route_path: string | null
  href: string | null
  created_at: string
  updated_at: string
}

/** Normalize DB slug for locale keys (`gift_packs` → `gift-packs`). */
export function normalizedHubServiceLineSlug(slug: string): string {
  return slug.trim().toLowerCase().replace(/_/g, "-")
}

export type HubServiceLineCopyInput = Pick<HubServiceLineRow, "slug" | "title" | "short_description">

/**
 * Hub grid tiles use DB title/description by default. When `hub.serviceLineTiles.{slug}` exists
 * in `app` locales, those strings override for the active language.
 */
export function hubServiceLineTileCopy(
  line: HubServiceLineCopyInput,
  t: (key: string, options?: { defaultValue?: string }) => string,
): { title: string; shortDescription: string | null } {
  let slug = normalizedHubServiceLineSlug(line.slug)
  if (slug === "send-money") slug = "send"

  const base = `hub.serviceLineTiles.${slug}`
  const title = t(`${base}.title`, { defaultValue: line.title })
  const dbDesc = line.short_description?.trim() ?? ""
  const shortDescriptionRaw = t(`${base}.shortDescription`, { defaultValue: dbDesc })
  const shortDescription = shortDescriptionRaw.trim() || null
  return { title, shortDescription }
}

/**
 * Line page shells: translate by route slug even when the row is still loading.
 */
export function hubServiceLineShellLabels(
  slug: string,
  line: HubServiceLineCopyInput | null | undefined,
  t: (key: string, options?: { defaultValue?: string }) => string,
  fallbackTitle: string,
): { title: string; subtitle: string | null } {
  let keySlug = normalizedHubServiceLineSlug(slug)
  if (keySlug === "send-money") keySlug = "send"

  const base = `hub.serviceLineTiles.${keySlug}`
  const dbTitle = line?.title?.trim() ?? ""
  const dbDesc = line?.short_description?.trim() ?? ""

  const title = t(`${base}.title`, { defaultValue: dbTitle || fallbackTitle })
  const subtitleRaw = t(`${base}.shortDescription`, { defaultValue: dbDesc })
  const subtitle = subtitleRaw.trim() || null
  return { title, subtitle }
}
