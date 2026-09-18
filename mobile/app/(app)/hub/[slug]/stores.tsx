import { useEffect, useState } from "react"
import { ScrollView, StyleSheet, Text } from "react-native"
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { EmptyState } from "@/components/empty-state"
import { Screen } from "@/components/screen"
import { StoreRow } from "@/components/store-item"
import { fetchWithAuth } from "@/lib/api"
import { hubMarketplaceVendorPath, isHubMarketplaceSlug } from "@/lib/hub"
import type { HubVendor } from "@/lib/types"
import { colors, space, type as typeSize } from "@/lib/theme"

export default function StoresScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const line = String(slug || "").toLowerCase()
  const router = useRouter()
  const navigation = useNavigation()
  const { t } = useTranslation("app")
  const [vendors, setVendors] = useState<HubVendor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    navigation.setOptions({ title: t("hub.marketplaceStoresHeading", { defaultValue: "Stores" }) })
  }, [navigation, t])

  useEffect(() => {
    if (!isHubMarketplaceSlug(line)) return
    void (async () => {
      const res = await fetchWithAuth(`/api/hub/vendors?service_line=${encodeURIComponent(line)}`)
      const body = (await res.json().catch(() => ({}))) as { vendors?: HubVendor[] }
      setVendors(body.vendors || [])
      setLoading(false)
    })()
  }, [line])

  return (
    <Screen edges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sub}>{t("hub.storesDirectorySubtitle", { defaultValue: "Choose a store to see its products." })}</Text>
        {loading ? <Text style={styles.loading}>Loading…</Text> : null}
        {!loading && vendors.length === 0 ? (
          <EmptyState title={t("hub.marketplaceNoVendors", { defaultValue: "No stores yet — check back soon." })} />
        ) : null}
        {vendors.map((v) => (
          <StoreRow
            key={v.id}
            vendor={v}
            onPress={() => router.push(hubMarketplaceVendorPath(line, v.slug) as never)}
          />
        ))}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space.page, paddingBottom: 40, paddingTop: 8 },
  sub: { marginBottom: 16, fontSize: typeSize.meta, lineHeight: 18, color: colors.muted },
  loading: { paddingVertical: 32, textAlign: "center", color: colors.muted },
})
