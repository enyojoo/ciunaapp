import { useMemo } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Icon, PressableScale } from "@/components/ui"
import { MAIN_CATEGORIES, expertMainCategory, serviceMainCategory, type MainCategory, type MainCategoryId } from "@/lib/expert-category"
import type { ExpertCatalogService, ExpertProfile } from "@/lib/types"
import { colors, radius, type as typeSize } from "@/lib/theme"

export function expertCategoryPath(id: MainCategoryId): string {
  return `/experts/c/${id}`
}

export type CategoryCounts = Map<MainCategoryId, { experts: number; services: number }>

/** How many experts and services sit in each main category. */
export function useCategoryCounts(profiles: ExpertProfile[], services: ExpertCatalogService[]): CategoryCounts {
  return useMemo(() => {
    const m: CategoryCounts = new Map()
    const bump = (id: MainCategoryId, k: "experts" | "services") => {
      const cur = m.get(id) ?? { experts: 0, services: 0 }
      cur[k] += 1
      m.set(id, cur)
    }
    for (const p of profiles) bump(expertMainCategory(p), "experts")
    for (const s of services) bump(serviceMainCategory(s), "services")
    return m
  }, [profiles, services])
}

/** Needs shown even before anyone offers them, so the grid always says what Ciuna covers. */
const ALWAYS_SHOWN = new Set<MainCategoryId>(["errands"])

/**
 * The "What do you need?" grid: one compact tile per main category that has someone in it, plus Errands, always
 * last. Each tile opens that category's page of experts and services.
 */
export function ExpertCategoryGrid({ counts }: { counts: CategoryCounts }) {
  const shown = MAIN_CATEGORIES.filter((c) => {
    const n = counts.get(c.id)
    return ALWAYS_SHOWN.has(c.id) || (n && (n.experts > 0 || n.services > 0))
  })
  if (shown.length === 0) return null
  return (
    <View style={styles.grid}>
      {shown.map((c) => (
        <CategoryTile key={c.id} category={c} count={counts.get(c.id) ?? { experts: 0, services: 0 }} />
      ))}
    </View>
  )
}

/** Compact tile: the glyph on the need's colour, a short name and how many experts or services it has. */
function CategoryTile({ category, count }: { category: MainCategory; count: { experts: number; services: number } }) {
  const { t } = useTranslation("app")
  const router = useRouter()
  const title = t(`experts.cat.${category.id}.title`)
  const line =
    count.experts > 0
      ? t("experts.cat.expertCount", { count: count.experts })
      : count.services > 0
        ? t("experts.discover.serviceCount", { count: count.services })
        : t("experts.cat.soon", { defaultValue: "Coming soon" })
  return (
    <PressableScale
      onPress={() => router.push(expertCategoryPath(category.id) as never)}
      haptics
      scaleTo={0.97}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${line}`}
      style={styles.tile}
    >
      <View style={[styles.icon, { backgroundColor: category.bg }]}>
        <Icon name={category.icon} size={20} color={category.fg} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.count} numberOfLines={1}>
          {line}
        </Text>
      </View>
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
  tile: { width: "48.6%", minHeight: 68, flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontSize: typeSize.meta, lineHeight: 18, fontWeight: "700", color: colors.text },
  count: { fontSize: typeSize.caption, color: colors.muted },
})
