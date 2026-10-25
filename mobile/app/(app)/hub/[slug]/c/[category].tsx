import { useMemo, useState } from "react"
import { StyleSheet, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { CatalogProducts } from "@/components/catalog-products"
import { EmptyState } from "@/components/empty-state"
import { LoadError } from "@/components/load-error"
import { HubCartBar } from "@/components/hub-cart-bar"
import { HubCartHeaderButton } from "@/components/hub-cart-header-button"
import { HubLinePageShell } from "@/components/hub-line-page-shell"
import { ChipRow } from "@/components/ui"
import { hubLineHomePath, hubMarketplaceVendorPath, hubProductDetailPath } from "@/lib/hub"
import { attachVendorsToProducts } from "@/lib/hub-catalog"
import { hubCategory, productMainCategory, type HubLine } from "@/lib/hub-category"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useLocationFilter } from "@/lib/location"
import { useHubCatalog } from "@/lib/use-hub-catalog"

const ALL = "__all__"

/** One meal type (Food) or aisle (Mart) across every store, with chips to narrow it to one store. */
export default function HubCategoryScreen() {
  const { slug, category } = useLocalSearchParams<{ slug: string; category: string }>()
  const line: HubLine = String(slug || "").toLowerCase() === "mart" ? "mart" : "food"
  const id = String(category || "")
  const cat = hubCategory(line, id)
  const { t } = useTranslation("app")
  const router = useRouter()
  const { data, loading, error, revalidate } = useHubCatalog(line, true)
  const [store, setStore] = useState(ALL)
  useFocusRevalidate(revalidate)

  const located = useLocationFilter(data?.vendors || [], data?.products || [])
  const products = useMemo(() => {
    const all = attachVendorsToProducts(located.products, located.vendors, line)
    return all.filter((p) => productMainCategory(p, line) === id)
  }, [located, line, id])

  // Stores that sell something in this category, for the chips.
  const stores = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of products) if (p.vendor?.id && p.vendor.name) m.set(p.vendor.id, p.vendor.name)
    return [...m.entries()].map(([sid, name]) => ({ id: sid, label: name }))
  }, [products])
  const shown = store === ALL ? products : products.filter((p) => p.vendor?.id === store)
  const title = cat ? t(`hub.cat.${line}.${id}`) : t("hub.cat.allProducts", { defaultValue: "All products" })

  return (
    <View style={styles.flex}>
      <HubLinePageShell
        title={title}
        backAriaLabel={t("common.back", { defaultValue: "Back" })}
        backHref={hubLineHomePath(line)}
        trailingAction={<HubCartHeaderButton lineSlug={line} />}
      >
        {stores.length > 1 ? (
          <View style={styles.chips}>
            <ChipRow
              inset={20}
              value={store}
              onChange={setStore}
              options={[{ id: ALL, label: t("hub.cat.allStores", { defaultValue: "All stores" }) }, ...stores]}
            />
          </View>
        ) : null}
        {!loading && shown.length === 0 && error && !data ? (
          <LoadError onRetry={() => void revalidate()} />
        ) : !loading && shown.length === 0 ? (
          <EmptyState title={t("hub.cat.empty", { defaultValue: "Nothing here yet." })} body={t("hub.cat.emptyBody", { defaultValue: "Stores are adding products. Check back soon." })} />
        ) : (
          <CatalogProducts
            products={shown}
            loading={loading && !data}
            category=""
            onCategoryChange={() => {}}
            hideChips
            heading={t("hub.cat.productCount", { count: shown.length })}
            showVendor
            onProductPress={(p) => router.push(hubProductDetailPath(line, p.id) as never)}
            onVendorPress={(p) => {
              if (p.vendor?.slug) router.push(hubMarketplaceVendorPath(line, p.vendor.slug) as never)
            }}
            cartLineSlug={line}
          />
        )}
      </HubLinePageShell>
      <HubCartBar lineSlug={line} />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chips: { marginHorizontal: -20, marginBottom: 16 },
})
