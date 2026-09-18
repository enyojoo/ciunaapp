import { useEffect, useState } from "react"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { CatalogProducts } from "@/components/catalog-products"
import { EmptyState } from "@/components/empty-state"
import { HubLinePageShell } from "@/components/hub-line-page-shell"
import { fetchWithAuth } from "@/lib/api"
import { hubLineHomePath, hubMarketplaceCheckoutPath } from "@/lib/hub"
import type { HubProduct, HubVendor } from "@/lib/types"

export default function VendorScreen() {
  const { slug, vendor: vendorParam } = useLocalSearchParams<{ slug: string; vendor: string }>()
  const line = String(slug || "").toLowerCase()
  const vendorSlug = String(vendorParam || "")
  const router = useRouter()
  const { t } = useTranslation("app")
  const [products, setProducts] = useState<HubProduct[]>([])
  const [vendor, setVendor] = useState<HubVendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    void (async () => {
      const [pRes, vRes] = await Promise.all([
        fetchWithAuth(
          `/api/hub/vendors/${encodeURIComponent(vendorSlug)}/products?service_line=${encodeURIComponent(line)}`,
        ),
        fetchWithAuth(
          `/api/hub/vendors/${encodeURIComponent(vendorSlug)}?service_line=${encodeURIComponent(line)}`,
        ),
      ])
      if (!pRes.ok && !vRes.ok) {
        setNotFound(true)
        setLoading(false)
        return
      }
      const body = pRes.ok ? ((await pRes.json()) as { products?: HubProduct[] }) : { products: [] }
      const rows = body.products || []
      setProducts(rows)
      let found: HubVendor | null = null
      if (vRes.ok) {
        const vBody = (await vRes.json()) as { vendor?: HubVendor | null }
        found = vBody.vendor ?? null
      }
      const fromProduct = rows[0]?.vendor
      setVendor(
        found ||
          (fromProduct
            ? {
                id: fromProduct.id,
                name: fromProduct.name,
                slug: fromProduct.slug,
                photo_url: fromProduct.photo_url,
                is_verified: fromProduct.is_verified,
              }
            : null),
      )
      setNotFound(!found && rows.length === 0)
      setLoading(false)
    })()
  }, [line, vendorSlug])

  const title =
    vendor?.name ||
    (notFound
      ? t("hub.vendorStoreNotFound", { defaultValue: "Store not found" })
      : t("hub.marketplaceStoresHeading", { defaultValue: "Stores" }))

  return (
    <HubLinePageShell
      variant="storefront"
      title={title}
      subtitle={vendor?.short_bio ?? null}
      backAriaLabel={t("hub.backToLine", { defaultValue: "Back to line" })}
      backHref={hubLineHomePath(line)}
      photoUrl={vendor?.photo_url}
      location={vendor?.location}
      verified={Boolean(vendor?.is_verified)}
      verifiedAriaLabel={t("hub.verifiedVendor", { defaultValue: "Verified vendor" })}
      heroLoading={loading && !vendor}
    >
      {!loading && notFound && !vendor ? (
        <EmptyState
          title={t("hub.vendorStoreNotFound", { defaultValue: "Store not found" })}
          body={t("hub.vendorStoreNotFoundBody", {
            defaultValue: "This store is unavailable or the link may be incorrect.",
          })}
        />
      ) : (
        <CatalogProducts
          products={products}
          loading={loading}
          showVendor={false}
          showCategory
          onProductPress={(p) => router.push(hubMarketplaceCheckoutPath(line, p.id) as never)}
        />
      )}
    </HubLinePageShell>
  )
}
