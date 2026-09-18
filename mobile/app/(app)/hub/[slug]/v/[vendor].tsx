import { useEffect, useState } from "react"
import { ScrollView, Text } from "react-native"
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router"
import { EmptyState } from "@/components/empty-state"
import { ProductCard } from "@/components/product-card"
import { Screen } from "@/components/screen"
import { apiFetch } from "@/lib/api"
import { hubMarketplaceCheckoutPath } from "@/lib/hub"
import type { HubProduct } from "@/lib/types"

export default function VendorScreen() {
  const { slug, vendor } = useLocalSearchParams<{ slug: string; vendor: string }>()
  const line = String(slug || "").toLowerCase()
  const vendorSlug = String(vendor || "")
  const router = useRouter()
  const navigation = useNavigation()
  const [products, setProducts] = useState<HubProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const res = await apiFetch(
        `/api/hub/vendors/${encodeURIComponent(vendorSlug)}/products?service_line=${encodeURIComponent(line)}`,
      )
      const body = (await res.json()) as { products?: HubProduct[] }
      const rows = body.products || []
      setProducts(rows)
      const name = rows[0]?.vendor?.name
      if (name) navigation.setOptions({ title: name })
      setLoading(false)
    })()
  }, [line, vendorSlug, navigation])

  return (
    <Screen edges={["left", "right"]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {loading ? <Text className="py-8 text-center text-muted">Loading…</Text> : null}
        {!loading && products.length === 0 ? <EmptyState title="No products" /> : null}
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            cta="Order"
            onPress={() => router.push(hubMarketplaceCheckoutPath(line, p.id) as never)}
          />
        ))}
      </ScrollView>
    </Screen>
  )
}
