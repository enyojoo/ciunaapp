import { useMemo } from "react"
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { Redirect, useLocalSearchParams, useRouter } from "expo-router"
import { ChevronRight } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { hubServiceLineShellLabels } from "@ciuna/shared"
import { useHubServiceLine } from "@/lib/use-hub-service-line"
import { CatalogProducts } from "@/components/catalog-products"
import { EmptyState } from "@/components/empty-state"
import { HubCartBar } from "@/components/hub-cart-bar"
import { HubCartHeaderButton } from "@/components/hub-cart-header-button"
import { HubLinePageShell } from "@/components/hub-line-page-shell"
import { StoreChip, StoreChipSkeleton } from "@/components/store-item"
import { attachVendorsToProducts } from "@/lib/hub-catalog"
import {
  hubMarketplaceStoresPath,
  hubMarketplaceVendorPath,
  hubProductDetailPath,
  isHubMarketplaceSlug,
  isHubExpertsSlug,
  isHubSendSlug,
} from "@/lib/hub"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useHubCatalog } from "@/lib/use-hub-catalog"
import { useRevalidateOnForeground } from "@/lib/use-revalidate-on-foreground"
import { colors } from "@/lib/theme"

const STORES_PREVIEW = 8

export default function HubLineCatalog() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const line = String(slug || "").toLowerCase()
  const { t } = useTranslation("app")
  const router = useRouter()
  const serviceLine = useHubServiceLine(line)
  const labels = hubServiceLineShellLabels(line, serviceLine, t, line)
  const marketplace = isHubMarketplaceSlug(line)
  const engineRedirect = isHubExpertsSlug(line) ? "/experts" : isHubSendSlug(line) ? "/send" : null
  const backAria = t("hub.backToHub", { defaultValue: "Back to Hub" })

  const { data, loading, refreshing, refresh, revalidate } = useHubCatalog(
    engineRedirect ? "" : line,
    marketplace,
  )
  const products = data?.products || []
  const vendors = data?.vendors || []

  useFocusRevalidate(revalidate)
  useRevalidateOnForeground(revalidate)

  const catalogProducts = useMemo(() => attachVendorsToProducts(products, vendors, line), [products, vendors, line])
  const previewVendors = vendors.slice(0, STORES_PREVIEW)
  const storesLoading = loading && vendors.length === 0

  const catalog = (
    <>
      {marketplace ? (
        <View style={styles.storesBlock}>
          <View style={styles.storesHead}>
            <Text style={styles.storesTitle}>{t("hub.marketplaceStoresHeading", { defaultValue: "Stores" })}</Text>
            {vendors.length > 0 ? (
              <Pressable
                onPress={() => router.push(hubMarketplaceStoresPath(line) as never)}
                hitSlop={8}
                style={styles.seeAllHit}
                accessibilityRole="button"
                accessibilityLabel={t("hub.marketplaceSeeAllStores", { defaultValue: "See all" })}
              >
                <Text style={styles.seeAll}>{t("hub.marketplaceSeeAllStores", { defaultValue: "See all" })}</Text>
                <ChevronRight size={16} color={colors.primary} strokeWidth={2.2} />
              </Pressable>
            ) : null}
          </View>
          {storesLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storesRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <StoreChipSkeleton key={i} />
              ))}
            </ScrollView>
          ) : vendors.length === 0 ? (
            <Text style={styles.storesEmpty}>
              {t("hub.marketplaceNoVendors", { defaultValue: "No stores yet — check back soon." })}
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storesRow}>
              {previewVendors.map((v) => (
                <StoreChip
                  key={v.id}
                  vendor={v}
                  onPress={() => router.push(hubMarketplaceVendorPath(line, v.slug) as never)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      ) : null}

      <CatalogProducts
        products={catalogProducts}
        loading={loading}
        showVendor
        onProductPress={(p) => router.push(hubProductDetailPath(line, p.id) as never)}
        onVendorPress={(p) => {
          const vendorSlug = p.vendor?.slug
          if (vendorSlug) router.push(hubMarketplaceVendorPath(line, vendorSlug) as never)
        }}
        cartLineSlug={marketplace ? (line as "food" | "mart") : undefined}
      />
    </>
  )

  if (engineRedirect) return <Redirect href={engineRedirect as never} />

  if (!marketplace && !loading && products.length === 0) {
    return (
      <HubLinePageShell title={labels.title} subtitle={labels.subtitle} backAriaLabel={backAria}>
        <EmptyState
          title={t("hub.unavailableTitle", { defaultValue: "Unavailable" })}
          body={t("hub.serviceUnavailable", { defaultValue: "This service is currently unavailable." })}
        />
      </HubLinePageShell>
    )
  }

  return (
    <View style={styles.flex}>
      <HubLinePageShell
        title={labels.title}
        subtitle={labels.subtitle}
        backAriaLabel={backAria}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
        trailingAction={marketplace ? <HubCartHeaderButton lineSlug={line as "food" | "mart"} variant="hero" /> : undefined}
      >
        {catalog}
      </HubLinePageShell>
      {marketplace ? <HubCartBar lineSlug={line as "food" | "mart"} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  storesBlock: { marginBottom: 32 },
  storesHead: { marginBottom: 12, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  storesTitle: { fontSize: 18, fontWeight: "600", color: colors.text },
  seeAllHit: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingLeft: 12,
  },
  seeAll: { fontSize: 14, fontWeight: "600", color: colors.primary },
  storesRow: { gap: 12, paddingRight: 8, paddingVertical: 2 },
  storesEmpty: { paddingVertical: 8, fontSize: 14, color: colors.muted },
})
