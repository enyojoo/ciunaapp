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

function localeKeySlug(slug: string): string {
  const n = normalizedHubServiceLineSlug(slug)
  return n === "send-money" ? "send" : n
}

/** Match office/API rows to a route slug (`send` ↔ `send-money`, underscores vs hyphens). */
export function findHubServiceLineBySlug(
  lines: readonly HubServiceLineRow[],
  slug: string,
): HubServiceLineRow | null {
  const want = localeKeySlug(slug)
  return (
    lines.find((line) => localeKeySlug(line.slug) === want) ?? null
  )
}

/**
 * Home grid + line shells use Office Hub Services (`title`, `short_description`) when set.
 * Locale `hub.serviceLineTiles.{slug}` is only a fallback while the row is missing or blank.
 */
/** The locale string, or "" when the key is missing (i18next returns the key itself for a miss). */
function localeText(t: (key: string, options?: { defaultValue?: string }) => string, key: string): string {
  const v = t(key, { defaultValue: "" }).trim()
  return v === key ? "" : v
}

export function hubServiceLineTileCopy(
  line: HubServiceLineCopyInput,
  t: (key: string, options?: { defaultValue?: string }) => string,
  language?: string,
): { title: string; shortDescription: string | null } {
  const base = `hub.serviceLineTiles.${localeKeySlug(line.slug)}`
  // Office edits the English copy in the database. In any other language the translated locale string wins when it exists.
  const translated = !!language && !language.toLowerCase().startsWith("en")
  const localTitle = translated ? localeText(t, `${base}.title`) : ""
  const localDesc = translated ? localeText(t, `${base}.shortDescription`) : ""
  const dbTitle = line.title?.trim() ?? ""
  const dbDesc = line.short_description?.trim() ?? ""
  const title = localTitle || dbTitle || t(`${base}.title`, { defaultValue: line.title })
  const shortDescriptionRaw = localDesc || dbDesc || t(`${base}.shortDescription`, { defaultValue: dbDesc })
  const shortDescription = shortDescriptionRaw.trim() || null
  return { title, shortDescription }
}

/**
 * Line page shells: Office copy when the row is loaded; locale keys while loading.
 */
export function hubServiceLineShellLabels(
  slug: string,
  line: HubServiceLineCopyInput | null | undefined,
  t: (key: string, options?: { defaultValue?: string }) => string,
  fallbackTitle: string,
  language?: string,
): { title: string; subtitle: string | null } {
  const base = `hub.serviceLineTiles.${localeKeySlug(slug)}`
  const translated = !!language && !language.toLowerCase().startsWith("en")
  const localTitle = translated ? localeText(t, `${base}.title`) : ""
  const localDesc = translated ? localeText(t, `${base}.shortDescription`) : ""
  const dbTitle = line?.title?.trim() ?? ""
  const dbDesc = line?.short_description?.trim() ?? ""

  const title = localTitle || dbTitle || t(`${base}.title`, { defaultValue: fallbackTitle })
  const subtitleRaw = localDesc || dbDesc || t(`${base}.shortDescription`, { defaultValue: "" })
  const subtitle = subtitleRaw.trim() || null
  return { title, subtitle }
}
