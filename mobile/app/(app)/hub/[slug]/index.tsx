import { useCallback, useEffect, useState } from "react"
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native"
import { Image } from "expo-image"
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { hubServiceLineShellLabels } from "@ciuna/shared"
import { ComingSoon } from "@/components/empty-state"
import { EmptyState } from "@/components/empty-state"
import { ProductCard } from "@/components/product-card"
import { Screen } from "@/components/screen"
import { apiFetch } from "@/lib/api"
import { isHubMarketplaceSlug, hubMarketplaceCheckoutPath, hubMarketplaceStoresPath, hubMarketplaceVendorPath } from "@/lib/hub"
import type { HubProduct, HubVendor } from "@/lib/types"

export default function HubLineCatalog() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const line = String(slug || "").toLowerCase()
  const { t } = useTranslation("app")
  const router = useRouter()
  const navigation = useNavigation()
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
        apiFetch(`/api/hub/products?service_line=${encodeURIComponent(line)}`),
        marketplace ? apiFetch(`/api/hub/vendors?service_line=${encodeURIComponent(line)}`) : Promise.resolve(null),
      ])
      if (pRes.ok) {
        const body = (await pRes.json()) as { products?: HubProduct[] }
        setProducts(body.products || [])
      } else setProducts([])
      if (vRes && vRes.ok) {
        const body = (await vRes.json()) as { vendors?: HubVendor[] }
        setVendors(body.vendors || [])
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [line, marketplace])

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
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load() }} tintColor="#F97316" />
        }
      >
        {labels.subtitle ? <Text className="mb-4 text-sm text-muted">{labels.subtitle}</Text> : null}
        {vendors.length > 0 ? (
          <View className="mb-5">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="font-semibold text-gray-900">Stores</Text>
              <Pressable onPress={() => router.push(hubMarketplaceStoresPath(line) as never)}>
                <Text className="text-sm font-medium text-primary">See all</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {vendors.slice(0, 12).map((v) => (
                <Pressable
                  key={v.id}
                  onPress={() => router.push(hubMarketplaceVendorPath(line, v.slug) as never)}
                  className="w-20 items-center"
                >
                  {v.photo_url ? (
                    <Image source={{ uri: v.photo_url }} style={{ width: 64, height: 64, borderRadius: 32 }} />
                  ) : (
                    <View className="h-16 w-16 rounded-full bg-surface" />
                  )}
                  <Text className="mt-1 text-center text-xs text-gray-900" numberOfLines={2}>
                    {v.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {loading ? <Text className="py-8 text-center text-muted">Loading…</Text> : null}
        {!loading && products.length === 0 ? (
          <EmptyState title="Nothing here yet" body="This catalog is empty." />
        ) : (
          products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              cta="Order"
              onPress={() => router.push(hubMarketplaceCheckoutPath(line, p.id) as never)}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  )
}
