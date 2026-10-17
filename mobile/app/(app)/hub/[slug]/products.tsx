import { useMemo, useState } from "react"
import { StyleSheet, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { DirectorySearch } from "@/components/directory-filters"
import { CatalogProducts } from "@/components/catalog-products"
import { HubCartBar } from "@/components/hub-cart-bar"
import { HubCartHeaderButton } from "@/components/hub-cart-header-button"
import { HubLinePageShell } from "@/components/hub-line-page-shell"
import { attachVendorsToProducts } from "@/lib/hub-catalog"
import { hubLineHomePath, hubMarketplaceVendorPath, hubProductDetailPath, isHubMarketplaceSlug } from "@/lib/hub"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useLocationFilter } from "@/lib/location"
import { useHubCatalog } from "@/lib/use-hub-catalog"

export default function ProductsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const line = String(slug || "").toLowerCase()
  const router = useRouter()
  const { t } = useTranslation("app")
  const marketplace = isHubMarketplaceSlug(line)
  const { data, loading, revalidate } = useHubCatalog(marketplace ? line : "", marketplace)
  const located = useLocationFilter(data?.vendors || [], data?.products || [])
  const products = useMemo(
    () => attachVendorsToProducts(located.products, located.vendors, line),
    [located, line],
  )
  const [category, setCategory] = useState("")
  const [query, setQuery] = useState("")
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return products
    return products.filter((p) => [p.title, p.short_description, p.vendor?.name, p.category].some((x) => (x || "").toLowerCase().includes(needle)))
  }, [products, query])

  useFocusRevalidate(revalidate)

  return (
    <View style={styles.flex}>
      <HubLinePageShell
        title={t("hub.marketplaceSeeAllProducts", { defaultValue: "All Products" })}
        backAriaLabel={t("hub.backToLine", { defaultValue: "Back to line" })}
        backHref={hubLineHomePath(line)}
        trailingAction={marketplace ? <HubCartHeaderButton lineSlug={line as "food" | "mart"} /> : undefined}
      >
        <DirectorySearch value={query} onChange={setQuery} placeholder={t("hub.searchProducts", { defaultValue: "Search products" })} />
        <CatalogProducts
          products={shown}
          loading={loading}
          category={category}
          onCategoryChange={setCategory}
          hideHeading
          showVendor
          onProductPress={(p) => router.push(hubProductDetailPath(line, p.id) as never)}
          onVendorPress={(p) => {
            const vendorSlug = p.vendor?.slug
            if (vendorSlug) router.push(hubMarketplaceVendorPath(line, vendorSlug) as never)
          }}
          cartLineSlug={marketplace ? (line as "food" | "mart") : undefined}
        />
      </HubLinePageShell>
      {marketplace ? <HubCartBar lineSlug={line as "food" | "mart"} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
})
