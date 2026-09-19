import { useMemo, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { ChevronDown, ChevronRight } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { hubServiceLineShellLabels } from "@ciuna/shared"
import { useHubServiceLine } from "@/lib/use-hub-service-line"
import { EmptyState } from "@/components/empty-state"
import {
  ExpertFeaturedChip,
  ExpertFeaturedSkeleton,
  ExpertServiceCard,
  ExpertServiceSkeleton,
} from "@/components/expert-catalog"
import { HubLinePageShell } from "@/components/hub-line-page-shell"
import { SheetPicker } from "@/components/sheet-picker"
import { useExpertCatalogServices } from "@/lib/use-expert-catalog-services"
import { useExpertProfiles } from "@/lib/use-expert-profiles"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useRevalidateOnForeground } from "@/lib/use-revalidate-on-foreground"
import { colors, radius, type as typeSize } from "@/lib/theme"

const FEATURED_PREVIEW = 8
const ALL_VALUE = "__all__"

export default function ExpertsDirectory() {
  const router = useRouter()
  const { t } = useTranslation("app")
  const expertsLine = useHubServiceLine("experts")
  const labels = hubServiceLineShellLabels("experts", expertsLine, t, t("hub.expertsTitle", { defaultValue: "Experts" }))
  const { data: profilesData, loading: loadingProfiles, revalidate: revalidateProfiles } = useExpertProfiles()
  const { data: servicesData, loading: loadingServices, revalidate: revalidateServices } = useExpertCatalogServices()
  const profiles = profilesData || []
  const services = servicesData || []
  const [category, setCategory] = useState("")
  const [pickerOpen, setPickerOpen] = useState(false)

  const revalidateAll = () => {
    revalidateProfiles()
    revalidateServices()
  }
  useFocusRevalidate(revalidateAll)
  useRevalidateOnForeground(revalidateAll)

  const featured = useMemo(() => {
    return [...profiles]
      .sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0
        return tb - ta
      })
      .slice(0, FEATURED_PREVIEW)
  }, [profiles])

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const s of services) {
      const c = (s.expert.category || "").trim()
      if (c) set.add(c)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [services])

  const visibleServices = useMemo(() => {
    const q = category.trim().toLowerCase()
    if (!q) return services
    return services.filter((s) => (s.expert.category || "").trim().toLowerCase() === q)
  }, [services, category])

  const allLabel = t("hub.allCategories", { defaultValue: "All categories" })
  const filterAria = t("hub.categoryFilterAria", { defaultValue: "Filter by category" })
  const pickerItems = useMemo(
    () => [{ id: ALL_VALUE, label: allLabel }, ...categories.map((c) => ({ id: c, label: c }))],
    [allLabel, categories],
  )

  return (
    <HubLinePageShell
      title={labels.title}
      subtitle={labels.subtitle ?? t("hub.expertsSubtitle", { defaultValue: "Trusted professionals for all your home and beauty needs." })}
      backAriaLabel={t("hub.backToHub", { defaultValue: "Back to Hub" })}
    >
      <View style={styles.featuredBlock}>
        <View style={styles.head}>
          <Text style={styles.heading}>{t("hub.expertsFeaturedHeading", { defaultValue: "Featured" })}</Text>
          {profiles.length > 0 ? (
            <Pressable
              onPress={() => router.push("/experts/browse" as never)}
              hitSlop={8}
              style={styles.seeAllHit}
              accessibilityRole="button"
              accessibilityLabel={t("hub.expertsSeeAll", { defaultValue: "See all" })}
            >
              <Text style={styles.seeAll}>{t("hub.expertsSeeAll", { defaultValue: "See all" })}</Text>
              <ChevronRight size={16} color={colors.primary} strokeWidth={2.2} />
            </Pressable>
          ) : null}
        </View>
        {loadingProfiles && profiles.length === 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
            {Array.from({ length: 5 }).map((_, i) => (
              <ExpertFeaturedSkeleton key={i} />
            ))}
          </ScrollView>
        ) : featured.length === 0 ? (
          <Text style={styles.empty}>
            {t("hub.expertsFeaturedEmpty", { defaultValue: "No experts yet — check back soon." })}
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
            {featured.map((ex) => (
              <ExpertFeaturedChip key={ex.id} expert={ex} />
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.toolbar}>
        <Text style={styles.headingInline} numberOfLines={1}>
          {t("hub.expertsServicesHeading", { defaultValue: "Services" })}
        </Text>
        {categories.length > 0 ? (
          <Pressable onPress={() => setPickerOpen(true)} accessibilityRole="button" accessibilityLabel={filterAria} style={styles.selectHit}>
            <View style={styles.select}>
              <Text style={styles.selectValue} numberOfLines={1}>
                {category || allLabel}
              </Text>
              <ChevronDown size={16} color={colors.muted} strokeWidth={2.2} />
            </View>
          </Pressable>
        ) : null}
      </View>
      <SheetPicker
        open={pickerOpen}
        title={filterAria}
        items={pickerItems}
        keyExtractor={(item) => item.id}
        labelExtractor={(item) => item.label}
        selectedId={category || ALL_VALUE}
        onSelect={(item) => setCategory(item.id === ALL_VALUE ? "" : item.id)}
        onClose={() => setPickerOpen(false)}
      />

      {loadingServices && services.length === 0 ? (
        <View style={styles.grid}>
          <ExpertServiceSkeleton />
          <ExpertServiceSkeleton />
          <ExpertServiceSkeleton />
          <ExpertServiceSkeleton />
        </View>
      ) : services.length === 0 ? (
        <EmptyState title={t("hub.expertsServicesEmpty", { defaultValue: "No services listed yet." })} />
      ) : visibleServices.length === 0 ? (
        <EmptyState
          title={t("hub.expertsServicesNoneInCategory", { defaultValue: "No services in this category." })}
          actionLabel={allLabel}
          onAction={() => setCategory("")}
        />
      ) : (
        <View style={styles.grid}>
          {visibleServices.map((s) => (
            <ExpertServiceCard key={s.id} service={s} />
          ))}
        </View>
      )}
    </HubLinePageShell>
  )
}

const styles = StyleSheet.create({
  featuredBlock: { marginBottom: 32 },
  head: { marginBottom: 12, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  heading: { fontSize: 18, fontWeight: "600", color: colors.text },
  headingInline: { flex: 1, minWidth: 0, fontSize: 18, fontWeight: "600", color: colors.text, marginRight: 8 },
  seeAllHit: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 2, paddingLeft: 12 },
  seeAll: { fontSize: 14, fontWeight: "600", color: colors.primary },
  strip: { gap: 12, paddingRight: 8, paddingVertical: 2 },
  empty: { paddingVertical: 8, fontSize: 14, color: colors.muted },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 16,
  },
  selectHit: { maxWidth: 176, minWidth: 132 },
  select: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingLeft: 12,
    paddingRight: 10,
  },
  selectValue: { flex: 1, minWidth: 0, fontSize: typeSize.meta, fontWeight: "500", color: colors.text },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
})
