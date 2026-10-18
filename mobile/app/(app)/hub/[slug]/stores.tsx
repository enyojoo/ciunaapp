import { useMemo, useState } from "react"
import { StyleSheet, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { DirectoryCount, DirectorySearch, directoryStyles } from "@/components/directory-filters"
import { EmptyState } from "@/components/empty-state"
import { FilterChips } from "@/components/filter-chips"
import { HubCartBar } from "@/components/hub-cart-bar"
import { HubCartHeaderButton } from "@/components/hub-cart-header-button"
import { HubLinePageShell } from "@/components/hub-line-page-shell"
import { StoreGridCard, StoreGridSkeleton } from "@/components/store-item"
import { hubLineHomePath, hubMarketplaceVendorPath, isHubMarketplaceSlug } from "@/lib/hub"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useLocationFilter } from "@/lib/location"
import { useHubCatalog } from "@/lib/use-hub-catalog"

export default function StoresScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const line = String(slug || "").toLowerCase()
  const router = useRouter()
  const { t } = useTranslation("app")
  const marketplace = isHubMarketplaceSlug(line)
  const { data, loading, revalidate } = useHubCatalog(marketplace ? line : "", marketplace)
  const allVendors = data?.vendors || []
  const { vendors } = useLocationFilter(allVendors, [])
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"" | "open" | "delivers">("")
  const canOpen = vendors.some((v) => v.hours_configured)
  const canDeliver = vendors.some((v) => (v.delivery_zone_count ?? 0) > 0)
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return vendors
      .filter((v) => filter !== "open" || (v.is_open === true && !v.is_paused))
      .filter((v) => filter !== "delivers" || (v.delivery_zone_count ?? 0) > 0)
      .filter((v) => !needle || [v.name, v.short_bio, v.location].some((x) => (x || "").toLowerCase().includes(needle)))
  }, [vendors, query, filter])
  const filtering = Boolean(query.trim() || filter)
  const clear = () => {
    setQuery("")
    setFilter("")
  }
  const title = t("hub.marketplaceSeeAllStores", { defaultValue: "All Stores" })

  useFocusRevalidate(revalidate)

  return (
    <View style={styles.flex}>
      <HubLinePageShell
        title={title}
        subtitle={t("hub.storesDirectorySubtitle", { defaultValue: "Choose a store to see its products." })}
        backAriaLabel={t("hub.backToLine", { defaultValue: "Back to line" })}
        backHref={hubLineHomePath(line)}
        trailingAction={marketplace ? <HubCartHeaderButton lineSlug={line as "food" | "mart"} /> : undefined}
      >
        {vendors.length > 0 ? (
          <>
            <DirectorySearch value={query} onChange={setQuery} placeholder={t("hub.searchStores", { defaultValue: "Search stores" })} />
            {canOpen || canDeliver ? (
              <View style={directoryStyles.chips}>
                <FilterChips
                  options={[
                    { id: "", label: t("hub.filterAll", { defaultValue: "All" }) },
                    ...(canOpen ? [{ id: "open" as const, label: t("hub.filterOpenNow", { defaultValue: "Open now" }) }] : []),
                    ...(canDeliver ? [{ id: "delivers" as const, label: t("hub.filterDelivers", { defaultValue: "Delivers" }) }] : []),
                  ]}
                  value={filter}
                  onChange={setFilter}
                />
              </View>
            ) : null}
            <DirectoryCount count={filtered.length} filtering={filtering} onClear={clear} />
          </>
        ) : null}
        {loading && vendors.length === 0 ? (
          <View style={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <StoreGridSkeleton key={i} />
            ))}
          </View>
        ) : null}
        {!loading && vendors.length === 0 ? (
          <EmptyState title={t("hub.marketplaceNoVendors", { defaultValue: "No stores yet. Check back soon." })} />
        ) : null}
        {vendors.length > 0 && filtered.length === 0 ? (
          <EmptyState
            title={t("hub.noMatch", { defaultValue: "No matches" })}
            body={t("hub.noMatchBody", { defaultValue: "Try another name or filter." })}
            actionLabel={t("hub.clearFilters", { defaultValue: "Clear filters" })}
            onAction={clear}
          />
        ) : null}
        {filtered.length > 0 ? (
          <View style={styles.grid}>
            {filtered.map((v) => (
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
