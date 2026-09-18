"use client"

import { useEffect, useLayoutEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { HubProductRow } from "@/lib/hub-types"
import type { HubVendorRow } from "@/lib/hub-vendor-types"
import type { HubServiceLineRow } from "@/lib/hub-service-line-types"
import { sortHubCatalogProducts } from "@/lib/hub-catalog-utils"
import { HubLinePageShell } from "@/components/hub/hub-line-page-shell"
import { HubMarketplaceLineHome } from "@/components/hub/hub-marketplace-line-home"
import {
  hubPublicHubJsonCacheUserId,
  isHubServiceLinesCacheFresh,
  readStaleHubServiceLinesCache,
  scheduleHubServiceLinesStaleWhileRevalidate,
  writeHubServiceLinesCache,
} from "@/lib/hub-client-cache"
import { findHubServiceLineBySlug, hubServiceLineShellLabels } from "@/lib/hub-service-line-i18n"
import {
  readFoodProductsCache,
  readFoodVendorsCache,
  writeFoodProductsCache,
  writeFoodVendorsCache,
} from "@/lib/marketplace-line-cache"
import { apiFetch } from "@/lib/api-client"

const LINE_SLUG = "food" as const
const SERVICE_LINES_CACHE_USER = hubPublicHubJsonCacheUserId()

function FoodLinePageInner() {
  const { t } = useTranslation("app")

  const [line, setLine] = useState<HubServiceLineRow | null>(null)
  const [linesLoaded, setLinesLoaded] = useState(false)
  const [products, setProducts] = useState<HubProductRow[]>([])
  const [vendors, setVendors] = useState<HubVendorRow[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingVendors, setLoadingVendors] = useState(true)

  /** Synchronous hydrate from /food cache so the page paints instantly on revisit. */
  useLayoutEffect(() => {
    const stale = readStaleHubServiceLinesCache(SERVICE_LINES_CACHE_USER)
    if (stale !== null) {
      setLine(findHubServiceLineBySlug(stale, LINE_SLUG))
      setLinesLoaded(true)
    }
    const cachedProducts = readFoodProductsCache()
    if (cachedProducts) {
      setProducts(sortHubCatalogProducts(cachedProducts.value))
      setLoadingProducts(false)
    }
    const cachedVendors = readFoodVendorsCache()
    if (cachedVendors) {
      setVendors(cachedVendors.value)
      setLoadingVendors(false)
    }
  }, [])

  /** Service lines: SWR so Office Hub Services title/description show up quickly. */
  useEffect(() => {
    const apply = (list: HubServiceLineRow[]) => {
      setLine(findHubServiceLineBySlug(list, LINE_SLUG))
    }
    if (isHubServiceLinesCacheFresh(SERVICE_LINES_CACHE_USER)) {
      const s = readStaleHubServiceLinesCache(SERVICE_LINES_CACHE_USER)
      if (s) apply(s)
      setLinesLoaded(true)
      scheduleHubServiceLinesStaleWhileRevalidate(
        SERVICE_LINES_CACHE_USER,
        async () => {
          const res = await apiFetch("/api/hub/service-lines", { cache: "no-store" })
          if (!res.ok) return null
          const data = await res.json()
          return (data.serviceLines || []) as HubServiceLineRow[]
        },
        apply,
      )
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiFetch("/api/hub/service-lines", { cache: "no-store" })
        if (!res.ok) throw new Error("lines")
        const data = await res.json()
        const list = (data.serviceLines || []) as HubServiceLineRow[]
        if (cancelled) return
        writeHubServiceLinesCache(SERVICE_LINES_CACHE_USER, list)
        apply(list)
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLinesLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  /** Products: skip fetch when fresh, otherwise refresh and update cache. */
  useEffect(() => {
    if (readFoodProductsCache()?.fresh) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiFetch(`/api/hub/products?service_line=${LINE_SLUG}`, { cache: "no-store" })
        if (!res.ok) throw new Error("products")
        const data = await res.json()
        const list = sortHubCatalogProducts((data.products || []) as HubProductRow[])
        if (cancelled) return
        setProducts(list)
        writeFoodProductsCache(list)
      } catch {
        if (!cancelled && products.length === 0) setProducts([])
      } finally {
        if (!cancelled) setLoadingProducts(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  /** Vendors: skip fetch when fresh, otherwise refresh and update cache. */
  useEffect(() => {
    if (readFoodVendorsCache()?.fresh) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiFetch(`/api/hub/vendors?service_line=${LINE_SLUG}`, { cache: "no-store" })
        if (!res.ok) throw new Error("vendors")
        const data = await res.json()
        const next = (data.vendors || []) as HubVendorRow[]
        if (cancelled) return
        setVendors(next)
        writeFoodVendorsCache(next)
      } catch {
        if (!cancelled && vendors.length === 0) setVendors([])
      } finally {
        if (!cancelled) setLoadingVendors(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const { title, subtitle } = useMemo(
    () => hubServiceLineShellLabels(LINE_SLUG, line, t, t("hub.hub")),
    [line, t],
  )

  if (linesLoaded && line && !line.is_enabled) {
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
    <HubLinePageShell title={title} subtitle={subtitle} backToHubAriaLabel={t("hub.backToHub")}>
      <HubMarketplaceLineHome
        lineSlug={LINE_SLUG}
        vendors={vendors}
        allProducts={products}
        loadingVendors={loadingVendors}
        loadingProducts={loadingProducts}
      />
    </HubLinePageShell>
  )
}

export default function FoodLinePage() {
  return <FoodLinePageInner />
}
