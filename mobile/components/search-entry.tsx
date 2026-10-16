import { Pressable, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { Search } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { colors, radius, space, type as typeSize } from "@/lib/theme"

export function searchHref(line?: "food" | "mart" | "experts") {
  return (line ? `/search?line=${line}` : "/search") as never
}

/** Tappable search field (opens the Search screen). Pass a line to scope it; `embedded` drops the header padding. */
export function SearchEntryField({ line, embedded }: { line?: "food" | "mart" | "experts"; embedded?: boolean } = {}) {
  const { t } = useTranslation("app")
  const router = useRouter()
  const label = line && line !== "experts"
    ? t("search.placeholderLine", { defaultValue: "Search products and stores" })
    : t("search.placeholder", { defaultValue: "Search products, stores, experts" })
  return (
    <View style={embedded ? styles.embedded : styles.wrap}>
      <Pressable onPress={() => router.push(searchHref(line))} accessibilityRole="search" accessibilityLabel={label} style={styles.field}>
        <Search size={18} color={colors.muted} strokeWidth={2.2} />
        <Text style={styles.text} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    </View>
  )
}

/** Round icon button for the orange hero on Food, Mart and Experts. */
export function SearchHeroButton({ line }: { line: "food" | "mart" | "experts" }) {
  const { t } = useTranslation("app")
  const router = useRouter()
  return (
    <Pressable
      onPress={() => router.push(searchHref(line))}
      accessibilityRole="button"
      accessibilityLabel={t("search.openAria", { defaultValue: "Search" })}
      hitSlop={8}
      style={styles.heroHit}
    >
      <View style={styles.heroChip}>
        <Search size={20} color={colors.text} strokeWidth={2.2} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.page, paddingBottom: 12, backgroundColor: colors.surface },
  embedded: { marginBottom: 16 },
  field: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    paddingHorizontal: 16,
  },
  text: { flex: 1, fontSize: typeSize.body, color: colors.muted },
  heroHit: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  heroChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
})
