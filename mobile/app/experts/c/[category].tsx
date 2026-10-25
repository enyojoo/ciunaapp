import { useMemo } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"
import { EmptyState } from "@/components/empty-state"
import { LoadError } from "@/components/load-error"
import { ExpertFeaturedChip, ExpertFeaturedSkeleton, ExpertServiceCard, ExpertServiceSkeleton } from "@/components/expert-catalog"
import { HubLinePageShell } from "@/components/hub-line-page-shell"
import { Icon } from "@/components/ui"
import { expertMainCategory, isMainCategoryId, mainCategory, serviceMainCategory } from "@/lib/expert-category"
import { useExpertCatalogServices } from "@/lib/use-expert-catalog-services"
import { useExpertProfiles } from "@/lib/use-expert-profiles"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { colors, radius, type as typeSize } from "@/lib/theme"

/** One need, everything in it: who can help (experts) and what you can book (services). */
export default function ExpertCategoryScreen() {
  const { t } = useTranslation("app")
  const params = useLocalSearchParams<{ category: string }>()
  const id = isMainCategoryId(String(params.category)) ? (String(params.category) as Parameters<typeof mainCategory>[0]) : "errands"
  const cat = mainCategory(id)
  const { data: profilesData, loading: loadingProfiles, revalidate: revalidateProfiles } = useExpertProfiles()
  const { data: servicesData, loading: loadingServices, error: servicesError, revalidate: revalidateServices } = useExpertCatalogServices()

  useFocusRevalidate(() => {
    revalidateProfiles()
    revalidateServices()
  })

  const experts = useMemo(() => (profilesData || []).filter((p) => expertMainCategory(p) === id), [profilesData, id])
  const services = useMemo(() => (servicesData || []).filter((s) => serviceMainCategory(s) === id), [servicesData, id])

  const loading = (loadingProfiles && !profilesData) || (loadingServices && !servicesData)

  return (
    <HubLinePageShell title={t(`experts.cat.${id}.title`)} subtitle={t(`experts.cat.${id}.blurb`)} backAriaLabel={t("common.back", { defaultValue: "Back" })} backHref="/experts" searchLine="experts">
      <View style={[styles.band, { backgroundColor: cat.bg }]}>
        <View style={styles.bandIcon}>
          <Icon name={cat.icon} size={22} color={cat.fg} />
        </View>
        <Text style={[styles.bandText, { color: cat.fg }]} numberOfLines={2}>
          {[
            experts.length > 0 ? t("experts.cat.expertCount", { count: experts.length }) : null,
            services.length > 0 ? t("experts.discover.serviceCount", { count: services.length }) : null,
          ]
            .filter(Boolean)
            .join(" · ") || " "}
        </Text>
      </View>

      {loading || experts.length > 0 ? (
        <View style={styles.block}>
          <Text style={styles.heading}>{t("experts.cat.whoCanHelp", { defaultValue: "Who can help" })}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.strip}>
            {loading ? Array.from({ length: 2 }).map((_, i) => <ExpertFeaturedSkeleton key={i} />) : experts.map((ex) => <ExpertFeaturedChip key={ex.id} expert={ex} />)}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.block}>
        <Text style={styles.heading}>{t("experts.cat.whatToBook", { defaultValue: "What you can book" })}</Text>
        {loading ? (
          <View style={styles.grid}>
            <ExpertServiceSkeleton />
            <ExpertServiceSkeleton />
          </View>
        ) : services.length === 0 && servicesError && !servicesData ? (
          <LoadError onRetry={() => void revalidateServices()} />
        ) : services.length === 0 ? (
          <EmptyState title={t("experts.cat.empty", { defaultValue: "Nothing to book here yet." })} body={t("experts.cat.emptyBody", { defaultValue: "We're adding experts. Check back soon or ask support for help." })} />
        ) : (
          <View style={styles.grid}>
            {services.map((s) => (
              <ExpertServiceCard key={s.id} service={s} />
            ))}
          </View>
        )}
      </View>
    </HubLinePageShell>
  )
}

const styles = StyleSheet.create({
  band: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: radius.card, marginBottom: 16 },
  bandIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.7)" },
  bandText: { flex: 1, fontSize: typeSize.meta, fontWeight: "700" },
  bleed: { marginHorizontal: -20 },
  block: { marginBottom: 28, gap: 12 },
  heading: { fontSize: typeSize.headline, lineHeight: 25, fontWeight: "700", color: colors.text },
  strip: { gap: 12, paddingHorizontal: 20, paddingVertical: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
})
