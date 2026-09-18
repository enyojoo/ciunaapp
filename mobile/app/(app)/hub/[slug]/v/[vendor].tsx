import { useEffect, useState } from "react"
import { ScrollView, StyleSheet } from "react-native"
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { EmptyState } from "@/components/empty-state"
import { ProductCard, ProductCardSkeleton } from "@/components/product-card"
import { Screen } from "@/components/screen"
import { fetchWithAuth } from "@/lib/api"
import { hubMarketplaceCheckoutPath } from "@/lib/hub"
import type { HubProduct } from "@/lib/types"
import { space } from "@/lib/theme"

export default function VendorScreen() {
  const { slug, vendor } = useLocalSearchParams<{ slug: string; vendor: string }>()
  const line = String(slug || "").toLowerCase()
  const vendorSlug = String(vendor || "")
  const router = useRouter()
  const navigation = useNavigation()
  const { t } = useTranslation("app")
  const [products, setProducts] = useState<HubProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const res = await fetchWithAuth(
        `/api/hub/vendors/${encodeURIComponent(vendorSlug)}/products?service_line=${encodeURIComponent(line)}`,
      )
      if (!res.ok) {
        setProducts([])
        setLoading(false)
        navigation.setOptions({ title: t("hub.vendorStoreNotFound", { defaultValue: "Store not found" }) })
        return
      }
      const body = (await res.json()) as { products?: HubProduct[] }
      const rows = body.products || []
      setProducts(rows)
      const name = rows[0]?.vendor?.name
      navigation.setOptions({ title: name || t("hub.marketplaceStoresHeading", { defaultValue: "Stores" }) })
      setLoading(false)
    })()
  }, [line, vendorSlug, navigation, t])

  return (
    <Screen edges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <>
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </>
        ) : null}
        {!loading && products.length === 0 ? (
          <EmptyState
            title={t("hub.vendorStoreNotFound", { defaultValue: "Store not found" })}
            body={t("hub.vendorStoreNotFoundBody", {
              defaultValue: "This store is unavailable or the link may be incorrect.",
            })}
          />
        ) : null}
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            cta={p.pricing_type === "user_input" ? t("hub.order", { defaultValue: "Order" }) : t("hub.buy", { defaultValue: "Buy" })}
            onPress={() => router.push(hubMarketplaceCheckoutPath(line, p.id) as never)}
          />
        ))}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space.page, paddingBottom: 40, paddingTop: 8 },
})
