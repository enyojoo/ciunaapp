"use client"

import { useEffect, useLayoutEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/lib/auth-context"
import type { HubProductRow } from "@/lib/hub-types"
import type { HubVendorRow } from "@/lib/hub-vendor-types"
import type { HubServiceLineRow } from "@/lib/hub-service-line-types"
import { sortHubCatalogProducts } from "@/lib/hub-catalog-utils"
import { HubLinePageShell } from "@/components/hub/hub-line-page-shell"
import { VendorHubCatalog } from "@/components/hub/vendor-hub-catalog"
import { HubCartBar } from "@/components/hub/hub-cart-bar"
import { HubCartHeaderButton } from "@/components/hub/hub-cart-header-button"
import { hubLineHomePath, hubMarketplaceVendorPath } from "@/lib/hub-public-paths"
import {
  hubPublicHubJsonCacheUserId,
  isHubServiceLinesCacheFresh,
  readStaleHubServiceLinesCache,
  writeHubServiceLinesCache,
} from "@/lib/hub-client-cache"
import {
  readMartVendorCache,
  readMartVendorProductsCache,
  writeMartVendorCache,
  writeMartVendorProductsCache,
} from "@/lib/marketplace-line-cache"
import { apiFetch } from "@/lib/api-client"

const LINE_SLUG = "mart" as const
const SERVICE_LINES_CACHE_USER = hubPublicHubJsonCacheUserId()

interface VendorPageProps {
  vendorSlug: string
}

function MartVendorStorefrontInner({ vendorSlug }: VendorPageProps) {
  const { t } = useTranslation("app")
  const { user } = useAuth()
  const showHeroClose = Boolean(user)

  const [line, setLine] = useState<HubServiceLineRow | null>(null)
  const [linesLoaded, setLinesLoaded] = useState(false)
  const [vendor, setVendor] = useState<HubVendorRow | null>(null)
  const [vendorResolved, setVendorResolved] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [products, setProducts] = useState<HubProductRow[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  /** Synchronous hydrate so the hero never flashes a placeholder when cache exists. */
  useLayoutEffect(() => {
    const stale = readStaleHubServiceLinesCache(SERVICE_LINES_CACHE_USER)
    if (stale !== null) {
      setLine(stale.find((l) => l.slug === LINE_SLUG) ?? null)
      setLinesLoaded(true)
    }
    if (!vendorSlug) return
    const cachedVendor = readMartVendorCache(vendorSlug)
    if (cachedVendor) {
      setVendor(cachedVendor.vendor)
      setNotFound(cachedVendor.notFound)
      setVendorResolved(true)
    }
    const cachedProducts = readMartVendorProductsCache(vendorSlug)
    if (cachedProducts) {
      setProducts(sortHubCatalogProducts(cachedProducts.value))
      setLoadingProducts(false)
    }
  }, [vendorSlug])

  /** Service lines: skip fetch when fresh. */
  useEffect(() => {
    if (isHubServiceLinesCacheFresh(SERVICE_LINES_CACHE_USER)) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiFetch("/api/hub/service-lines", { cache: "no-store" })
        if (!res.ok) throw new Error("lines")
        const data = await res.json()
        const list = (data.serviceLines || []) as HubServiceLineRow[]
        if (cancelled) return
        writeHubServiceLinesCache(SERVICE_LINES_CACHE_USER, list)
        setLine(list.find((l) => l.slug === LINE_SLUG) ?? null)
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

  /** Vendor meta: skip fetch when fresh, otherwise refresh in background. */
  useEffect(() => {
    if (!vendorSlug) return
    if (readMartVendorCache(vendorSlug)?.fresh) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiFetch(
          `/api/hub/vendors/${encodeURIComponent(vendorSlug)}?service_line=${LINE_SLUG}`,
          { cache: "no-store" },
        )
        if (res.status === 404) {
          if (cancelled) return
          setVendor(null)
          setNotFound(true)
          writeMartVendorCache(vendorSlug, null)
          return
        }
        if (!res.ok) throw new Error("vendor")
        const data = await res.json()
        const v = (data.vendor || null) as HubVendorRow | null
        if (cancelled) return
        setVendor(v)
        setNotFound(v == null)
        writeMartVendorCache(vendorSlug, v)
      } catch {
        /* keep stale value if any */
      } finally {
        if (!cancelled) setVendorResolved(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [vendorSlug])

  /** Vendor products: skip fetch when fresh, otherwise refresh and update cache. */
  useEffect(() => {
    if (!vendorSlug) return
    if (readMartVendorProductsCache(vendorSlug)?.fresh) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiFetch(
          `/api/hub/vendors/${encodeURIComponent(vendorSlug)}/products?service_line=${LINE_SLUG}`,
          { cache: "no-store" },
        )
        if (!res.ok) throw new Error("products")
        const data = await res.json()
        const list = sortHubCatalogProducts((data.products || []) as HubProductRow[])
        if (cancelled) return
        setProducts(list)
        writeMartVendorProductsCache(vendorSlug, list)
      } catch {
        if (!cancelled && products.length === 0) setProducts([])
      } finally {
        if (!cancelled) setLoadingProducts(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [vendorSlug])

  const lineHome = useMemo(() => hubLineHomePath(LINE_SLUG), [])
  const vendorBasePath = hubMarketplaceVendorPath(LINE_SLUG, vendorSlug)
  const heroLocation = (vendor?.location || "").trim() || null
  const subtitle = vendor != null ? (vendor.short_bio || "").trim() || null : null

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

  if (vendorResolved && notFound && !vendor) {
    return (
      <HubLinePageShell
        title={t("hub.vendorStoreNotFound", { defaultValue: "Store not found" })}
        subtitle={null}
        backToHubAriaLabel={t("hub.backToLine", { defaultValue: "Back to line" })}
        backHref={lineHome}
        showHeroClose={showHeroClose}
      >
        <p className="text-center text-sm text-muted-foreground">
          {t("hub.vendorStoreNotFoundBody", {
            defaultValue: "This store is unavailable or the link may be incorrect.",
          })}
        </p>
      </HubLinePageShell>
    )
  }

  return (
    <HubLinePageShell
      title={vendor?.name || ""}
      subtitle={subtitle}
      backToHubAriaLabel={t("hub.backToLine", { defaultValue: "Back to line" })}
      backHref={lineHome}
      heroPhotoUrl={vendor?.photo_url ?? null}
      heroLocation={heroLocation}
      heroTitleVerified={Boolean(vendor?.is_verified)}
      heroTitleVerifiedAriaLabel={t("hub.verifiedVendor", { defaultValue: "Verified vendor" })}
      heroLoading={!vendor}
      showHeroClose={showHeroClose}
      heroTrailingAction={<HubCartHeaderButton lineSlug={LINE_SLUG} />}
    >
      <VendorHubCatalog
        products={products}
        loading={loadingProducts}
        vendorBasePath={vendorBasePath}
        lineSlug={LINE_SLUG}
        vendorId={vendor?.id ?? null}
        showVendorChip={false}
      />
      <HubCartBar lineSlug={LINE_SLUG} vendorId={vendor?.id ?? null} />
    </HubLinePageShell>
  )
}

export default function MartVendorStorefrontPage() {
  const vendorSlug = String(useParams()?.vendorSlug || "").trim().toLowerCase()
  return <MartVendorStorefrontInner key={vendorSlug || "_"} vendorSlug={vendorSlug} />
}
