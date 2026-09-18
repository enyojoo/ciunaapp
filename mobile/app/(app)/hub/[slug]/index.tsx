import { useCallback, useEffect, useState } from "react"
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { hubServiceLineShellLabels } from "@ciuna/shared"
import { ComingSoon, EmptyState } from "@/components/empty-state"
import { ProductCard, ProductCardSkeleton } from "@/components/product-card"
import { Screen } from "@/components/screen"
import { StoreChip } from "@/components/store-item"
import { useToast } from "@/components/toast-provider"
import { fetchWithAuth } from "@/lib/api"
import {
  hubMarketplaceCheckoutPath,
  hubMarketplaceStoresPath,
  hubMarketplaceVendorPath,
  isHubMarketplaceSlug,
} from "@/lib/hub"
import type { HubProduct, HubVendor } from "@/lib/types"
import { colors, space, type as typeSize } from "@/lib/theme"

const STORES_PREVIEW = 8

export default function HubLineCatalog() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const line = String(slug || "").toLowerCase()
  const { t } = useTranslation("app")
  const router = useRouter()
  const navigation = useNavigation()
  const { showError } = useToast()
  const labels = hubServiceLineShellLabels(line, null, t, line)
  const marketplace = isHubMarketplaceSlug(line)

  const [products, setProducts] = useState<HubProduct[]>([])
  const [vendors, setVendors] = useState<HubVendor[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    navigation.setOptions({ title: labels.title })
  }, [labels.title, navigation])

  const load = useCallback(async () => {
    if (!line) return
    try {
      const [pRes, vRes] = await Promise.all([
        fetchWithAuth(`/api/hub/products?service_line=${encodeURIComponent(line)}`),
        marketplace
          ? fetchWithAuth(`/api/hub/vendors?service_line=${encodeURIComponent(line)}`)
          : Promise.resolve(null),
      ])
      if (!pRes.ok) throw new Error("catalog")
      const body = (await pRes.json()) as { products?: HubProduct[] }
      setProducts(body.products || [])
      if (vRes) {
        if (!vRes.ok) setVendors([])
        else {
          const vBody = (await vRes.json()) as { vendors?: HubVendor[] }
          setVendors(vBody.vendors || [])
        }
      }
    } catch {
      setProducts([])
      setVendors([])
      showError(t("errors.loadFailed", { defaultValue: "Could not load data. Please try again." }))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [line, marketplace, showError, t])

  useEffect(() => {
    void load()
  }, [load])

  if (!marketplace && !loading && products.length === 0) {
    return (
      <Screen>
        <ComingSoon title={labels.title} />
      </Screen>
    )
  }

  return (
    <Screen edges={["left", "right"]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              void load()
            }}
            tintColor={colors.primary}
          />
        }
      >
        {labels.subtitle ? <Text style={styles.subtitle}>{labels.subtitle}</Text> : null}
        {vendors.length > 0 ? (
          <View style={styles.storesBlock}>
            <View style={styles.storesHead}>
              <Text style={styles.storesTitle}>{t("hub.marketplaceStoresHeading", { defaultValue: "Stores" })}</Text>
              <Pressable
                onPress={() => router.push(hubMarketplaceStoresPath(line) as never)}
                hitSlop={8}
                style={styles.seeAllHit}
              >
                <Text style={styles.seeAll}>{t("hub.marketplaceSeeAllStores", { defaultValue: "See all" })}</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storesRow}>
              {vendors.slice(0, STORES_PREVIEW).map((v) => (
                <StoreChip
                  key={v.id}
                  vendor={v}
                  onPress={() => router.push(hubMarketplaceVendorPath(line, v.slug) as never)}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {loading ? (
          <>
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </>
        ) : products.length === 0 ? (
          <EmptyState title={t("hub.noProducts", { defaultValue: "No products available yet." })} />
        ) : (
          products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              cta={p.pricing_type === "user_input" ? t("hub.order", { defaultValue: "Order" }) : t("hub.buy", { defaultValue: "Buy" })}
              onPress={() => router.push(hubMarketplaceCheckoutPath(line, p.id) as never)}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: space.page, paddingBottom: 40 },
  subtitle: { marginBottom: 16, fontSize: typeSize.meta, lineHeight: 18, color: colors.muted },
  storesBlock: { marginBottom: 20 },
  storesHead: { marginBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  storesTitle: { fontSize: typeSize.label, fontWeight: "600", color: colors.text },
  seeAllHit: { minHeight: 44, justifyContent: "center", paddingLeft: 12 },
  seeAll: { fontSize: typeSize.meta, fontWeight: "600", color: colors.primary },
  storesRow: { gap: 12, paddingRight: 8 },
})
