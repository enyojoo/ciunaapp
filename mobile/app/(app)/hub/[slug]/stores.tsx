import { StyleSheet, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { hubServiceLineShellLabels } from "@ciuna/shared"
import { useHubServiceLine } from "@/lib/use-hub-service-line"
import { EmptyState } from "@/components/empty-state"
import { HubCartBar } from "@/components/hub-cart-bar"
import { HubCartHeaderButton } from "@/components/hub-cart-header-button"
import { HubLinePageShell } from "@/components/hub-line-page-shell"
import { StoreGridCard, StoreGridSkeleton } from "@/components/store-item"
import { hubLineHomePath, hubMarketplaceVendorPath, isHubMarketplaceSlug } from "@/lib/hub"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useHubCatalog } from "@/lib/use-hub-catalog"

export default function StoresScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const line = String(slug || "").toLowerCase()
  const router = useRouter()
  const { t } = useTranslation("app")
  const marketplace = isHubMarketplaceSlug(line)
  const { data, loading, revalidate } = useHubCatalog(marketplace ? line : "", marketplace)
  const vendors = data?.vendors || []
  const serviceLine = useHubServiceLine(line)
  const lineShell = hubServiceLineShellLabels(line, serviceLine, t, line)
  const title = `${t("hub.marketplaceStoresHeading", { defaultValue: "Stores" })} · ${lineShell.title}`

  useFocusRevalidate(revalidate)

  return (
    <View style={styles.flex}>
      <HubLinePageShell
        title={title}
        subtitle={t("hub.storesDirectorySubtitle", { defaultValue: "Choose a store to see its products." })}
        backAriaLabel={t("hub.backToLine", { defaultValue: "Back to line" })}
        backHref={hubLineHomePath(line)}
        trailingAction={marketplace ? <HubCartHeaderButton lineSlug={line as "food" | "mart"} variant="hero" /> : undefined}
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
      {marketplace ? <HubCartBar lineSlug={line as "food" | "mart"} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
})
