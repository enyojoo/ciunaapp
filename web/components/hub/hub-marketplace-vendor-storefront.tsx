"use client"

import { useEffect, useLayoutEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/lib/auth-context"
import type { HubProductRow, HubProductVendorSummary } from "@/lib/hub-types"
import type { HubVendorRow } from "@/lib/hub-vendor-types"
import type { HubServiceLineRow } from "@/lib/hub-service-line-types"
import { hubCachedProductsMatchServiceLine } from "@/lib/hub-slug"
import {
  clearHubVendorCatalogCache,
  hubMarketplaceSliceCacheUserId,
  hubPublicHubJsonCacheUserId,
  isHubServiceLinesCacheFresh,
  isHubVendorCatalogCacheFresh,
  isHubVendorMetaCacheFresh,
  readStaleHubServiceLinesCache,
  readStaleHubVendorCatalogCache,
  readStaleHubVendorMetaCache,
  scheduleHubServiceLinesStaleWhileRevalidate,
  writeHubServiceLinesCache,
  writeHubVendorCatalogCache,
  writeHubVendorMetaCache,
} from "@/lib/hub-client-cache"
import { HubLinePageShell } from "@/components/hub/hub-line-page-shell"
import { VendorHubCatalog } from "@/components/hub/vendor-hub-catalog"
import { sortHubCatalogProducts } from "@/lib/hub-catalog-utils"
import { hubLineHomePath, hubMarketplaceVendorPath } from "@/lib/hub-public-paths"
import { apiFetch } from "@/lib/api-client"

const MARKETPLACE = new Set(["food", "mart"])

const SERVICE_LINES_CACHE_USER = hubPublicHubJsonCacheUserId()

function vendorSummaryToHubRow(summary: HubProductVendorSummary, lineSlug: string): HubVendorRow {
  return {
    id: summary.id,
    service_line_slug: summary.service_line_slug || lineSlug,
    name: summary.name,
    slug: summary.slug,
    photo_url: summary.photo_url,
    short_bio: null,
    location: null,
    is_published: true,
    is_verified: summary.is_verified,
    created_at: "",
    updated_at: "",
  }
}

/** Vendor-scoped catalog always attaches `vendor`; older LS rows may omit `vendor.slug` — still use row[0]. */
function deriveVendorRowFromCatalogProducts(
  list: HubProductRow[] | null,
  vendorSlug: string,
  lineSlug: string,
): HubVendorRow | null {
  if (!list?.length) return null
  const vs = vendorSlug.trim().toLowerCase()
  if (!vs) return null
  const slugEq = (s: string | null | undefined) => (s || "").trim().toLowerCase() === vs

  const matched = list.find((p) => p.vendor && slugEq(p.vendor.slug))?.vendor
  if (matched) return vendorSummaryToHubRow(matched, lineSlug)

  const first = list[0]?.vendor
  if (first && slugEq(first.slug)) return vendorSummaryToHubRow(first, lineSlug)
  if (first) return vendorSummaryToHubRow(first, lineSlug)

  return null
}

function VendorCatalogInner({
  lineSlug,
  vendorSlug,
  cacheUserId,
}: {
  lineSlug: string
  vendorSlug: string
  cacheUserId: string
}) {
  const vendorBasePath = hubMarketplaceVendorPath(lineSlug, vendorSlug)
  const [products, setProducts] = useState<HubProductRow[]>([])
  const [loading, setLoading] = useState(false)

  useLayoutEffect(() => {
    if (!cacheUserId) return
    const stale = readStaleHubVendorCatalogCache(cacheUserId, lineSlug, vendorSlug)
    let rows = stale && stale.length > 0 ? sortHubCatalogProducts(stale) : []
    if (stale && stale.length > 0 && !hubCachedProductsMatchServiceLine(stale, lineSlug)) {
      clearHubVendorCatalogCache(cacheUserId, lineSlug, vendorSlug)
      rows = []
    }
    setProducts(rows)
    const hasRows = rows.length > 0
    const fresh = isHubVendorCatalogCacheFresh(cacheUserId, lineSlug, vendorSlug)
    if (!fresh && !hasRows) setLoading(true)
    else setLoading(false)
  }, [cacheUserId, lineSlug, vendorSlug])

  useEffect(() => {
    if (!cacheUserId || !MARKETPLACE.has(lineSlug)) return
    const staleCatalog = readStaleHubVendorCatalogCache(cacheUserId, lineSlug, vendorSlug)
    const rowsOk =
      !staleCatalog?.length || hubCachedProductsMatchServiceLine(staleCatalog, lineSlug)
    if (
      isHubVendorCatalogCacheFresh(cacheUserId, lineSlug, vendorSlug) &&
      (staleCatalog?.length ?? 0) > 0 &&
      rowsOk
    ) {
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await apiFetch(
          `/api/hub/vendors/${encodeURIComponent(vendorSlug)}/products?service_line=${encodeURIComponent(lineSlug)}`,
          { cache: "no-store" },
        )
        if (!res.ok) throw new Error("load")
        const data = await res.json()
        const list = sortHubCatalogProducts((data.products || []) as HubProductRow[])
        if (!cancelled) {
          setProducts(list)
          writeHubVendorCatalogCache(cacheUserId, lineSlug, vendorSlug, list)
        }
      } catch {
        if (!cancelled) setProducts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cacheUserId, lineSlug, vendorSlug])

  return (
    <VendorHubCatalog
      products={products}
      loading={loading}
      vendorBasePath={vendorBasePath}
      lineSlug={lineSlug}
      showVendorChip={false}
    />
  )
}

export function HubMarketplaceVendorStorefront({ lineSlug: lineProp, vendorSlug: vendorProp }: { lineSlug: string; vendorSlug: string }) {
  const lineSlug = String(lineProp || "").trim().toLowerCase()
  const vendorSlug = String(vendorProp || "").trim().toLowerCase()
  const sliceVendorCacheUserId = MARKETPLACE.has(lineSlug)
    ? hubMarketplaceSliceCacheUserId(lineSlug as "food" | "mart")
    : SERVICE_LINES_CACHE_USER
  const router = useRouter()
  const { t } = useTranslation("app")
  const { user } = useAuth()
  const showHeroClose = Boolean(user)
  const [lines, setLines] = useState<HubServiceLineRow[]>([])
  const [linesLoaded, setLinesLoaded] = useState(false)
  /** Authoritative row from `GET /api/hub/vendors/[slug]`. */
  const [vendorFromMeta, setVendorFromMeta] = useState<HubVendorRow | null>(null)
  /** Same-session / LS preview from product list (matches product grid stale-first UX). */
  const [vendorFromCatalog, setVendorFromCatalog] = useState<HubVendorRow | null>(null)
  /** Meta endpoint concluded (stale hit, stale 404, or fetch finished). */
  const [metaTerminal, setMetaTerminal] = useState(false)

  const line = useMemo(() => lines.find((l) => l.slug === lineSlug) ?? null, [lines, lineSlug])

  const displayVendor = useMemo(
    () => vendorFromMeta ?? vendorFromCatalog,
    [vendorFromMeta, vendorFromCatalog],
  )

  useLayoutEffect(() => {
    if (!MARKETPLACE.has(lineSlug) || !vendorSlug) return

    const meta = readStaleHubVendorMetaCache(sliceVendorCacheUserId, lineSlug, vendorSlug)
    if (meta.kind === "found") {
      setVendorFromMeta(meta.vendor)
      setVendorFromCatalog(null)
      setMetaTerminal(true)
      return
    }
    if (meta.kind === "not_found") {
      setVendorFromMeta(null)
      setVendorFromCatalog(null)
      setMetaTerminal(true)
      return
    }

    setVendorFromMeta(null)
    const list = readStaleHubVendorCatalogCache(sliceVendorCacheUserId, lineSlug, vendorSlug)
    const preview = deriveVendorRowFromCatalogProducts(list, vendorSlug, lineSlug)
    setVendorFromCatalog(preview)
    setMetaTerminal(false)
  }, [lineSlug, vendorSlug, sliceVendorCacheUserId])

  useLayoutEffect(() => {
    const stale = readStaleHubServiceLinesCache(SERVICE_LINES_CACHE_USER)
    if (stale !== null) {
      setLines(stale)
      setLinesLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (isHubServiceLinesCacheFresh(SERVICE_LINES_CACHE_USER)) {
      const s = readStaleHubServiceLinesCache(SERVICE_LINES_CACHE_USER)
      if (s) setLines(s)
      setLinesLoaded(true)
      scheduleHubServiceLinesStaleWhileRevalidate(SERVICE_LINES_CACHE_USER, async () => {
        const res = await apiFetch("/api/hub/service-lines", { cache: "no-store" })
        if (!res.ok) return null
        const data = await res.json()
        return (data.serviceLines || []) as HubServiceLineRow[]
      }, setLines)
      return
    }

    let cancelled = false
    const silent = readStaleHubServiceLinesCache(SERVICE_LINES_CACHE_USER) !== null
    ;(async () => {
      try {
        const res = await apiFetch("/api/hub/service-lines", { cache: "no-store" })
        if (!res.ok) throw new Error("lines")
        const data = await res.json()
        const next = (data.serviceLines || []) as HubServiceLineRow[]
        if (!cancelled) {
          setLines(next)
          writeHubServiceLinesCache(SERVICE_LINES_CACHE_USER, next)
        }
      } catch {
        if (!cancelled && !silent) setLines([])
      } finally {
        if (!cancelled) setLinesLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!MARKETPLACE.has(lineSlug) || !vendorSlug) return
    if (isHubVendorMetaCacheFresh(sliceVendorCacheUserId, lineSlug, vendorSlug)) return

    let cancelled = false
    ;(async () => {
      try {
        const res = await apiFetch(
          `/api/hub/vendors/${encodeURIComponent(vendorSlug)}?service_line=${encodeURIComponent(lineSlug)}`,
          { cache: "no-store" },
        )
        if (res.status === 404) {
          if (!cancelled) {
            setVendorFromMeta(null)
            setVendorFromCatalog(null)
            writeHubVendorMetaCache(sliceVendorCacheUserId, lineSlug, vendorSlug, null)
          }
          return
        }
        if (!res.ok) throw new Error("vendor")
        const data = await res.json()
        const v = (data.vendor || null) as HubVendorRow | null
        if (!cancelled) {
          setVendorFromMeta(v)
          setVendorFromCatalog(null)
          writeHubVendorMetaCache(sliceVendorCacheUserId, lineSlug, vendorSlug, v)
        }
      } catch {
        if (!cancelled) setVendorFromMeta(null)
      } finally {
        if (!cancelled) setMetaTerminal(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [lineSlug, vendorSlug, sliceVendorCacheUserId])

  useEffect(() => {
    if (lineSlug && !MARKETPLACE.has(lineSlug)) {
      router.replace("/hub")
    }
  }, [lineSlug, router])

  const title = displayVendor?.name || vendorSlug || line?.title || t("hub.hub")
  const subtitle =
    displayVendor != null
      ? (displayVendor.short_bio || "").trim() || null
      : (line?.short_description || "").trim() || null
  const heroLocation = (displayVendor?.location || "").trim() || null

  if (!MARKETPLACE.has(lineSlug)) {
    return (
      <div className="min-w-0 px-4 py-8 text-center text-sm text-muted-foreground">
        {t("hub.redirecting", { defaultValue: "Redirecting…" })}
      </div>
    )
  }

  const unavailable = linesLoaded && (!line || !line.is_enabled)

  if (unavailable) {
    return (
      <HubLinePageShell
        title={t("hub.unavailableTitle")}
        subtitle={null}
        backToHubAriaLabel={t("hub.backToHub")}
        showHeroClose={showHeroClose}
      >
        <p className="text-center text-sm text-muted-foreground">{t("hub.serviceUnavailable")}</p>
      </HubLinePageShell>
    )
  }

  if (metaTerminal && !displayVendor) {
    return (
      <HubLinePageShell
        title={t("hub.vendorStoreNotFound", { defaultValue: "Store not found" })}
        subtitle={null}
        backToHubAriaLabel={t("hub.backToLine", { defaultValue: "Back to line" })}
        backHref={hubLineHomePath(lineSlug)}
        showHeroClose={showHeroClose}
      >
        <p className="text-center text-sm text-muted-foreground">
          {t("hub.vendorStoreNotFoundBody", { defaultValue: "This store is unavailable or the link may be incorrect." })}
        </p>
      </HubLinePageShell>
    )
  }

  return (
    <HubLinePageShell
      title={title}
      subtitle={subtitle}
      backToHubAriaLabel={t("hub.backToLine", { defaultValue: "Back to line" })}
      backHref={hubLineHomePath(lineSlug)}
      heroPhotoUrl={displayVendor?.photo_url ?? null}
      heroLocation={heroLocation}
      heroTitleVerified={Boolean(displayVendor?.is_verified)}
      heroTitleVerifiedAriaLabel={t("hub.verifiedVendor", { defaultValue: "Verified vendor" })}
      heroLoading={false}
      showHeroClose={showHeroClose}
    >
      <VendorCatalogInner lineSlug={lineSlug} vendorSlug={vendorSlug} cacheUserId={sliceVendorCacheUserId} />
    </HubLinePageShell>
  )
}
