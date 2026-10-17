import { useMemo, useState } from "react"
import { StyleSheet, View } from "react-native"
import { useTranslation } from "react-i18next"
import { DirectoryCount, DirectorySearch, directoryStyles } from "@/components/directory-filters"
import { EmptyState } from "@/components/empty-state"
import { FilterChips } from "@/components/filter-chips"
import { ExpertServiceCard, ExpertServiceSkeleton } from "@/components/expert-catalog"
import { HubLinePageShell } from "@/components/hub-line-page-shell"
import { MAIN_CATEGORIES, serviceMainCategory } from "@/lib/expert-category"
import { useExpertAreaFilter } from "@/lib/location"
import { useExpertProfiles } from "@/lib/use-expert-profiles"
import { useExpertCatalogServices } from "@/lib/use-expert-catalog-services"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useRevalidateOnForeground } from "@/lib/use-revalidate-on-foreground"

export default function ExpertsServicesScreen() {
  const { t } = useTranslation("app")
  const { data, loading, revalidate } = useExpertCatalogServices()
  const { data: profilesData } = useExpertProfiles()
  const { services } = useExpertAreaFilter(profilesData || [], data || [])
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("")
  const [mode, setMode] = useState("")
  const categories = useMemo(() => {
    const present = new Set(services.map((s) => serviceMainCategory(s)))
    return MAIN_CATEGORIES.filter((c) => present.has(c.id))
  }, [services])
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return services
      .filter((s) => !category || serviceMainCategory(s) === category)
      .filter((s) => !mode || s.fulfillment_type === mode || s.fulfillment_type === "both")
      .filter((s) => !needle || [s.title, s.short_description, s.expert?.display_name].some((x) => (x || "").toLowerCase().includes(needle)))
  }, [services, query, category, mode])
  const filtering = Boolean(query.trim() || category || mode)
  const clear = () => {
    setQuery("")
    setCategory("")
    setMode("")
  }

  useFocusRevalidate(revalidate)
  useRevalidateOnForeground(revalidate)

  return (
    <HubLinePageShell
      title={t("experts.discover.allServices", { defaultValue: "All services" })}
      backAriaLabel={t("hub.backToExperts", { defaultValue: "Back to experts" })}
      backHref="/experts"
    >
      {services.length > 0 ? (
        <>
          <DirectorySearch value={query} onChange={setQuery} placeholder={t("hub.searchServices", { defaultValue: "Search services" })} />
          {categories.length > 1 ? (
            <View style={directoryStyles.chips}>
              <FilterChips
                options={[{ id: "", label: t("hub.filterAll", { defaultValue: "All" }) }, ...categories.map((c) => ({ id: c.id as string, label: t(`experts.cat.${c.id}.title`) }))]}
                value={category}
                onChange={setCategory}
              />
            </View>
          ) : null}
          <View style={directoryStyles.chips}>
            <FilterChips
              options={[
                { id: "", label: t("hub.filterAll", { defaultValue: "All" }) },
                { id: "online", label: t("hub.filterOnline", { defaultValue: "Online" }) },
                { id: "in_person", label: t("hub.filterInPerson", { defaultValue: "In person" }) },
              ]}
              value={mode}
              onChange={setMode}
            />
          </View>
          <DirectoryCount count={filtered.length} filtering={filtering} onClear={clear} />
        </>
      ) : null}
      {loading && services.length === 0 ? (
        <View style={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <ExpertServiceSkeleton key={i} />
          ))}
        </View>
      ) : services.length === 0 ? (
        <EmptyState title={t("hub.expertsServicesEmpty", { defaultValue: "No services listed yet." })} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t("hub.noMatch", { defaultValue: "No matches" })}
          body={t("hub.noMatchBody", { defaultValue: "Try another name or filter." })}
          actionLabel={t("hub.clearFilters", { defaultValue: "Clear filters" })}
          onAction={clear}
        />
      ) : (
        <View style={styles.grid}>
          {filtered.map((s) => (
            <ExpertServiceCard key={s.id} service={s} />
          ))}
        </View>
      )}
    </HubLinePageShell>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
})
