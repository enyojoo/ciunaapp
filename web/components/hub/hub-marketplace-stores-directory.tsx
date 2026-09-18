"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import type { HubVendorRow } from "@/lib/hub-vendor-types"
import type { HubServiceLineRow } from "@/lib/hub-service-line-types"
import { hubCachedVendorsMatchServiceLine, hubVendorBelongsToServiceLine } from "@/lib/hub-slug"
import {
  clearHubVendorListCache,
  hubMarketplaceSliceCacheUserId,
  hubPublicHubJsonCacheUserId,
  isHubServiceLinesCacheFresh,
  isHubVendorListCacheFresh,
  readStaleHubServiceLinesCache,
  readStaleHubVendorListCache,
  scheduleHubServiceLinesStaleWhileRevalidate,
  writeHubServiceLinesCache,
  writeHubVendorListCache,
} from "@/lib/hub-client-cache"
import { HubVendorCardNameRow } from "@/components/hub/hub-vendor-card-name-row"
import { HubLinePageShell } from "@/components/hub/hub-line-page-shell"
import { hubLineHomePath, hubMarketplaceVendorPath } from "@/lib/hub-public-paths"
import { hubServiceLineShellLabels } from "@/lib/hub-service-line-i18n"
import { apiFetch } from "@/lib/api-client"

const MARKETPLACE = new Set(["food", "mart"])

/** Public service-lines JSON only (shared across lines). Vendor directory uses `hubMarketplaceSliceCacheUserId`. */
const SERVICE_LINES_CACHE_USER = hubPublicHubJsonCacheUserId()

export function HubMarketplaceStoresDirectory({ lineSlug: slugProp }: { lineSlug: string }) {
  const slug = String(slugProp || "").trim().toLowerCase()
  const vendorListCacheUserId = MARKETPLACE.has(slug) ? hubMarketplaceSliceCacheUserId(slug as "food" | "mart") : SERVICE_LINES_CACHE_USER
  const router = useRouter()
  const { t } = useTranslation("app")
  const [lines, setLines] = useState<HubServiceLineRow[]>([])
  const [linesLoaded, setLinesLoaded] = useState(false)
  const [vendors, setVendors] = useState<HubVendorRow[]>([])
  const [loading, setLoading] = useState(true)

  const line = useMemo(() => lines.find((l) => l.slug === slug) ?? null, [lines, slug])
  const lineHome = hubLineHomePath(slug)
  /** Guard against cross-line stale cache — only render vendors that belong to this line. */
  const lineVendors = useMemo(
    () => vendors.filter((v) => hubVendorBelongsToServiceLine(v, slug)),
    [vendors, slug],
  )

  const prevSlugRef = useRef<string | null>(null)
  useLayoutEffect(() => {
    if (!MARKETPLACE.has(slug)) return
    const prev = prevSlugRef.current
    prevSlugRef.current = slug
    if (prev !== null && prev !== slug) {
      setVendors([])
      setLoading(true)
    }
  }, [slug])

  useLayoutEffect(() => {
    if (!MARKETPLACE.has(slug)) return
    const stale = readStaleHubServiceLinesCache(SERVICE_LINES_CACHE_USER)
    if (stale !== null) {
      setLines(stale)
      setLinesLoaded(true)
    }
  }, [slug])

  useLayoutEffect(() => {
    if (!MARKETPLACE.has(slug)) return
    const stale = readStaleHubVendorListCache(vendorListCacheUserId, slug)
    let list = stale ?? []
    if (list.length > 0 && !hubCachedVendorsMatchServiceLine(list, slug)) {
      clearHubVendorListCache(vendorListCacheUserId, slug)
      list = []
    }
    setVendors(list)
    const hasRows = list.length > 0
    const vendorListFresh = isHubVendorListCacheFresh(vendorListCacheUserId, slug)
    if (!vendorListFresh && !hasRows) {
      setLoading(true)
    } else {
      setLoading(false)
    }
  }, [slug, vendorListCacheUserId])

  useEffect(() => {
    if (!MARKETPLACE.has(slug)) {
      router.replace("/hub")
      return
    }
  }, [router, slug])

  useEffect(() => {
    if (!MARKETPLACE.has(slug)) return
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
  }, [slug])

  useEffect(() => {
    if (!MARKETPLACE.has(slug)) return
    // Always re-fetch vendor list (stale-while-revalidate).
    const staleRows = readStaleHubVendorListCache(vendorListCacheUserId, slug)
    const hasRows = (staleRows?.length ?? 0) > 0

    let cancelled = false
    if (!hasRows) setLoading(true)

    ;(async () => {
      try {
        const res = await apiFetch(`/api/hub/vendors?service_line=${encodeURIComponent(slug)}`, { cache: "no-store" })
        if (!res.ok) throw new Error("vendors")
        const data = await res.json()
        const next = (data.vendors || []) as HubVendorRow[]
        if (!cancelled) {
          setVendors(next)
          writeHubVendorListCache(vendorListCacheUserId, slug, next)
        }
      } catch {
        if (!cancelled) setVendors([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug, vendorListCacheUserId])

  const lineShell = useMemo(() => hubServiceLineShellLabels(slug, line, t, t("hub.hub")), [slug, line, t])
  const storesLabel = t("hub.marketplaceStoresHeading")
  const title = `${storesLabel} · ${lineShell.title}`
  const subtitle = t("hub.storesDirectorySubtitle")

  if (!MARKETPLACE.has(slug)) {
    return (
      <div className="min-w-0 px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-4 animate-pulse">
          <div className="h-10 rounded-lg bg-muted" />
          <div className="h-40 rounded-2xl bg-muted" />
        </div>
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
      >
        <p className="text-center text-sm text-muted-foreground">{t("hub.serviceUnavailable")}</p>
      </HubLinePageShell>
    )
  }

  return (
    <HubLinePageShell
      title={title}
      subtitle={subtitle}
      backToHubAriaLabel={t("hub.backToLine", { defaultValue: "Back to line" })}
      backHref={lineHome}
    >
      {loading && lineVendors.length === 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-muted" />
          ))}
        </div>
      ) : lineVendors.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {t("hub.marketplaceNoVendors", { defaultValue: "No stores yet — check back soon." })}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 sm:gap-4">
          {lineVendors.map((v) => (
            <Link
              key={v.id}
              href={hubMarketplaceVendorPath(slug, v.slug)}
              prefetch
              className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:border-orange-300/70 hover:shadow-md"
            >
              <div className="relative aspect-square w-full bg-muted">
                {v.photo_url ? (
                  <img
                    src={v.photo_url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-2 text-center text-xs text-muted-foreground">{v.name}</div>
                )}
              </div>
              <div className="space-y-1 border-t border-border/60 bg-card/80 p-3">
                <HubVendorCardNameRow
                  name={v.name}
                  isVerified={v.is_verified}
                  verifiedAriaLabel={t("hub.verifiedVendor", { defaultValue: "Verified vendor" })}
                  align="start"
                  textClassName="text-sm"
                />
                {v.short_bio ? <p className="line-clamp-2 text-xs text-muted-foreground">{v.short_bio}</p> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </HubLinePageShell>
  )
}
