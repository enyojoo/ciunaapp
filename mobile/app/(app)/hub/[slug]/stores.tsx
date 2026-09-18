import { useEffect, useState } from "react"
import { StyleSheet, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { hubServiceLineShellLabels } from "@ciuna/shared"
import { useHubServiceLine } from "@/lib/use-hub-service-line"
import { EmptyState } from "@/components/empty-state"
import { HubLinePageShell } from "@/components/hub-line-page-shell"
import { StoreGridCard, StoreGridSkeleton } from "@/components/store-item"
import { fetchWithAuth } from "@/lib/api"
import { hubLineHomePath, hubMarketplaceVendorPath, isHubMarketplaceSlug } from "@/lib/hub"
import type { HubVendor } from "@/lib/types"

export default function StoresScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const line = String(slug || "").toLowerCase()
  const router = useRouter()
  const { t } = useTranslation("app")
  const [vendors, setVendors] = useState<HubVendor[]>([])
  const [loading, setLoading] = useState(true)
  const serviceLine = useHubServiceLine(line)
  const lineShell = hubServiceLineShellLabels(line, serviceLine, t, line)
  const title = `${t("hub.marketplaceStoresHeading", { defaultValue: "Stores" })} · ${lineShell.title}`

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
    <HubLinePageShell
      title={title}
      subtitle={t("hub.storesDirectorySubtitle", { defaultValue: "Choose a store to see its products." })}
      backAriaLabel={t("hub.backToLine", { defaultValue: "Back to line" })}
      backHref={hubLineHomePath(line)}
    >
      {loading && vendors.length === 0 ? (
        <View style={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <StoreGridSkeleton key={i} />
          ))}
        </View>
      ) : null}
      {!loading && vendors.length === 0 ? (
        <EmptyState title={t("hub.marketplaceNoVendors", { defaultValue: "No stores yet — check back soon." })} />
      ) : null}
      {vendors.length > 0 ? (
        <View style={styles.grid}>
          {vendors.map((v) => (
            <StoreGridCard
              key={v.id}
              vendor={v}
              onPress={() => router.push(hubMarketplaceVendorPath(line, v.slug) as never)}
            />
          ))}
        </View>
      ) : null}
    </HubLinePageShell>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
})
