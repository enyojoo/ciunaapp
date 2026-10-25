import { useMemo } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { ChevronRight } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { hubServiceLineShellLabels } from "@ciuna/shared"
import { useHubServiceLine } from "@/lib/use-hub-service-line"
import { EmptyState } from "@/components/empty-state"
import { ExpertFeaturedChip, ExpertFeaturedSkeleton, ExpertServiceCard, ExpertServiceSkeleton } from "@/components/expert-catalog"
import { ExpertCategoryGrid, useCategoryCounts } from "@/components/expert-categories"
import { HubLinePageShell } from "@/components/hub-line-page-shell"
import { Skeleton } from "@/components/ui"
import { useExpertCatalogServices } from "@/lib/use-expert-catalog-services"
import { useExpertProfiles } from "@/lib/use-expert-profiles"
import { useExpertAreaFilter } from "@/lib/location"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useRevalidateOnForeground } from "@/lib/use-revalidate-on-foreground"
import { colors, radius, type as typeSize } from "@/lib/theme"

const FEATURED_PREVIEW = 8
const SERVICES_PREVIEW = 8

/**
 * Experts home: start from the need ("Documents and visas", "Study and language", …), then meet featured experts.
 * Each need opens a page with its experts and services, so nobody has to guess what an expert does from a name.
 */
export default function ExpertsDirectory() {
  const router = useRouter()
  const { t, i18n } = useTranslation("app")
  const expertsLine = useHubServiceLine("experts")
  const labels = hubServiceLineShellLabels("experts", expertsLine, t, t("hub.expertsTitle", { defaultValue: "Experts" }), i18n.language)
  const { data: profilesData, loading: loadingProfiles, revalidate: revalidateProfiles } = useExpertProfiles()
  const { data: servicesData, loading: loadingServices, revalidate: revalidateServices } = useExpertCatalogServices()
  const { profiles, services } = useExpertAreaFilter(profilesData || [], servicesData || [])
  const counts = useCategoryCounts(profiles, services)

  const revalidateAll = () => {
    revalidateProfiles()
    revalidateServices()
  }
  useFocusRevalidate(revalidateAll)
  useRevalidateOnForeground(revalidateAll)

  const featured = useMemo(
    () =>
      [...profiles]
        .sort((a, b) => (b.created_at ? new Date(b.created_at).getTime() : 0) - (a.created_at ? new Date(a.created_at).getTime() : 0))
        .slice(0, FEATURED_PREVIEW),
    [profiles],
  )
  const loading = (loadingProfiles && profiles.length === 0) || (loadingServices && services.length === 0)

  return (
    <HubLinePageShell
      title={labels.title}
      subtitle={labels.subtitle ?? t("hub.expertsSubtitle", { defaultValue: "Trusted professionals for all your home and beauty needs." })}
      backAriaLabel={t("hub.backToHub", { defaultValue: "Back to Hub" })}
      searchLine="experts"
      locationPicker
    >
      <View style={styles.block}>
        <Text style={styles.heading}>{t("experts.discover.needHeading", { defaultValue: "What do you need?" })}</Text>
        {loading ? (
          <View style={styles.skeletonGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} width="48.6%" height={68} rounded={radius.card} />
            ))}
          </View>
        ) : profiles.length === 0 && services.length === 0 ? (
          <EmptyState title={t("hub.expertsServicesEmpty", { defaultValue: "No services listed yet." })} />
        ) : (
          <ExpertCategoryGrid counts={counts} />
        )}
      </View>

      {loading || featured.length > 0 ? (
        <View style={styles.block}>
          <View style={styles.head}>
            <Text style={styles.heading}>{t("hub.expertsFeaturedHeading", { defaultValue: "Featured" })}</Text>
            {profiles.length > 0 ? (
              <Pressable
                onPress={() => router.push("/experts/browse" as never)}
                hitSlop={8}
                style={styles.seeAllHit}
                accessibilityRole="button"
                accessibilityLabel={t("hub.expertsSeeAll", { defaultValue: "All experts" })}
              >
                <Text style={styles.seeAll}>{t("hub.expertsSeeAll", { defaultValue: "All experts" })}</Text>
                <ChevronRight size={16} color={colors.primaryText} strokeWidth={2.2} />
              </Pressable>
            ) : null}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip} style={styles.bleed}>
            {loadingProfiles && profiles.length === 0
              ? Array.from({ length: 3 }).map((_, i) => <ExpertFeaturedSkeleton key={i} />)
              : featured.map((ex) => <ExpertFeaturedChip key={ex.id} expert={ex} />)}
          </ScrollView>
        </View>
      ) : null}

      {loading || services.length > 0 ? (
        <View style={styles.block}>
          <View style={styles.head}>
            <Text style={styles.heading}>{t("experts.discover.servicesHeading", { defaultValue: "Services" })}</Text>
            {services.length > 0 ? (
              <Pressable
                onPress={() => router.push("/experts/services" as never)}
                hitSlop={8}
                style={styles.seeAllHit}
                accessibilityRole="button"
                accessibilityLabel={t("experts.discover.allServices", { defaultValue: "All services" })}
              >
                <Text style={styles.seeAll}>{t("experts.discover.allServices", { defaultValue: "All services" })}</Text>
                <ChevronRight size={16} color={colors.primaryText} strokeWidth={2.2} />
              </Pressable>
            ) : null}
          </View>
          <View style={styles.grid}>
            {loadingServices && services.length === 0
              ? Array.from({ length: 4 }).map((_, i) => <ExpertServiceSkeleton key={i} />)
              : services.slice(0, SERVICES_PREVIEW).map((s) => <ExpertServiceCard key={s.id} service={s} />)}
          </View>
        </View>
      ) : null}
    </HubLinePageShell>
  )
}

const styles = StyleSheet.create({
  block: { marginBottom: 28, gap: 12 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heading: { fontSize: typeSize.headline, lineHeight: 25, fontWeight: "700", color: colors.text },
  seeAllHit: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 2, paddingLeft: 12 },
  seeAll: { fontSize: typeSize.listTitle, fontWeight: "600", color: colors.primaryText },
  // Rows that run to the screen edge inside the padded page.
  bleed: { marginHorizontal: -20 },
  strip: { gap: 12, paddingHorizontal: 20, paddingVertical: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
  skeletonGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
})
