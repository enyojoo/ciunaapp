import { Pressable, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { Search } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Icon } from "@/components/ui/icon"
import { NAV_ICON, NavAction } from "@/components/ui/nav-bar"
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

/** Search as a nav-bar action on Food, Mart and Experts. */
export function SearchHeroButton({ line }: { line: "food" | "mart" | "experts" }) {
  const { t } = useTranslation("app")
  const router = useRouter()
  return (
    <NavAction label={t("search.openAria", { defaultValue: "Search" })} onPress={() => router.push(searchHref(line))}>
      <Icon name="search" size={NAV_ICON} color={colors.text} />
    </NavAction>
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
})
