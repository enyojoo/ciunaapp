import { useMemo } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Icon, PressableScale } from "@/components/ui"
import { HIDDEN_WHEN_EMPTY, hubCategories, productMainCategory, type HubCategory, type HubLine } from "@/lib/hub-category"
import type { HubProduct } from "@/lib/types"
import { colors, radius, type as typeSize } from "@/lib/theme"

export function hubCategoryPath(line: HubLine, id: string): string {
  return `/hub/${line}/c/${id}`
}

/** How many products sit in each category of the line. */
export function useHubCategoryCounts(products: HubProduct[], line: HubLine): Map<string, number> {
  return useMemo(() => {
    const m = new Map<string, number>()
    for (const p of products) {
      const id = productMainCategory(p, line)
      m.set(id, (m.get(id) || 0) + 1)
    }
    return m
  }, [products, line])
}

function visible(line: HubLine, counts: Map<string, number>): HubCategory[] {
  return hubCategories(line).filter((c) => !HIDDEN_WHEN_EMPTY[line].has(c.id) || (counts.get(c.id) || 0) > 0)
}

/**
 * The meal types (Food) or categories (Mart) as compact tiles in a two-column grid, so every category is visible at
 * once without sideways scrolling. Each opens that category across all stores.
 */
export function HubCategoryGrid({ line, counts }: { line: HubLine; counts: Map<string, number> }) {
  const { t } = useTranslation("app")
  const router = useRouter()
  return (
    <View style={styles.grid}>
      {visible(line, counts).map((c) => {
        const name = t(`hub.cat.${line}.${c.id}`)
        const n = counts.get(c.id) || 0
        const sub = n > 0 ? t("hub.cat.productCount", { count: n }) : t("experts.cat.soon", { defaultValue: "Coming soon" })
        return (
          <PressableScale key={c.id} onPress={() => router.push(hubCategoryPath(line, c.id) as never)} haptics scaleTo={0.97} accessibilityRole="button" accessibilityLabel={`${name}. ${sub}`} style={styles.tile}>
            <View style={[styles.tileIcon, { backgroundColor: c.bg }]}>
              <Icon name={c.icon} size={20} color={c.fg} />
            </View>
            <View style={styles.tileCopy}>
              <Text style={styles.tileName} numberOfLines={2}>
                {name}
              </Text>
              <Text style={styles.tileCount} numberOfLines={1}>
                {sub}
              </Text>
            </View>
          </PressableScale>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
  tile: { width: "48.6%", minHeight: 68, flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  tileIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tileCopy: { flex: 1, minWidth: 0, gap: 2 },
  tileName: { fontSize: typeSize.meta, lineHeight: 18, fontWeight: "700", color: colors.text },
  tileCount: { fontSize: typeSize.caption, color: colors.muted },
})
