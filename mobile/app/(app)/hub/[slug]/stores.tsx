import { useEffect, useState } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"
import { Image } from "expo-image"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Screen } from "@/components/screen"
import { EmptyState } from "@/components/empty-state"
import { apiFetch } from "@/lib/api"
import { hubMarketplaceVendorPath, isHubMarketplaceSlug } from "@/lib/hub"
import type { HubVendor } from "@/lib/types"

export default function StoresScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const line = String(slug || "").toLowerCase()
  const router = useRouter()
  const [vendors, setVendors] = useState<HubVendor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isHubMarketplaceSlug(line)) return
    void (async () => {
      const res = await apiFetch(`/api/hub/vendors?service_line=${encodeURIComponent(line)}`)
      const body = (await res.json()) as { vendors?: HubVendor[] }
      setVendors(body.vendors || [])
      setLoading(false)
    })()
  }, [line])

  return (
    <Screen edges={["left", "right"]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {loading ? <Text className="py-8 text-center text-muted">Loading…</Text> : null}
        {!loading && vendors.length === 0 ? <EmptyState title="No stores yet" /> : null}
        {vendors.map((v) => (
          <Pressable
            key={v.id}
            onPress={() => router.push(hubMarketplaceVendorPath(line, v.slug) as never)}
            className="mb-3 min-h-[72px] flex-row items-center rounded-2xl border border-border bg-surface px-3 py-3"
          >
            {v.photo_url ? (
              <Image source={{ uri: v.photo_url }} style={{ width: 48, height: 48, borderRadius: 24 }} />
            ) : (
              <View className="h-12 w-12 rounded-full bg-paper" />
            )}
            <View className="ml-3 flex-1">
              <Text className="font-semibold text-gray-900">{v.name}</Text>
              {v.location ? <Text className="text-sm text-muted">{v.location}</Text> : null}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  )
}
