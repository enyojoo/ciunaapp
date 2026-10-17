import { Pressable, StyleSheet, Text, View } from "react-native"
import { Search, X } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { AppTextInput } from "@/components/app-text-input"
import { colors, radius, type as typeSize } from "@/lib/theme"

/** Search field shared by every "All …" list: experts, stores, products, services. */
export function DirectorySearch({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const { t } = useTranslation("app")
  return (
    <View style={styles.searchBox}>
      <Search size={18} color={colors.muted} strokeWidth={2} />
      <AppTextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.subtle}
        accessibilityLabel={placeholder}
        style={styles.searchInput}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value ? (
        <Pressable onPress={() => onChange("")} hitSlop={8} accessibilityRole="button" accessibilityLabel={t("common.clear", { defaultValue: "Clear" })}>
          <X size={18} color={colors.muted} strokeWidth={2} />
        </Pressable>
      ) : null}
    </View>
  )
}

/** "Results: 12" on the left, "Clear filters" on the right once anything is filtered. */
export function DirectoryCount({ count, filtering, onClear }: { count: number; filtering: boolean; onClear: () => void }) {
  const { t } = useTranslation("app")
  return (
    <View style={styles.countRow}>
      <Text style={styles.count}>{t("hub.resultsCount", { count, defaultValue: "Results: {{count}}" })}</Text>
      {filtering ? (
        <Pressable onPress={onClear} hitSlop={8} accessibilityRole="button">
          <Text style={styles.clear}>{t("hub.clearFilters", { defaultValue: "Clear filters" })}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

export const directoryStyles = StyleSheet.create({
  chips: { paddingBottom: 12 },
})

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, fontSize: typeSize.body, color: colors.text, paddingVertical: 8 },
  countRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  count: { fontSize: typeSize.meta, color: colors.muted },
  clear: { fontSize: typeSize.meta, fontWeight: "700", color: colors.primaryText },
})
