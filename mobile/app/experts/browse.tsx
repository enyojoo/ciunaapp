import { FilterChips } from "@/components/filter-chips"
import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Search, X } from "lucide-react-native"
import { AppTextInput } from "@/components/app-text-input"
import { EmptyState } from "@/components/empty-state"
import { ExpertDirectoryCard } from "@/components/expert-catalog"
import { HubLinePageShell } from "@/components/hub-line-page-shell"
import { LoadError } from "@/components/load-error"
import { useExpertProfiles } from "@/lib/use-expert-profiles"
import { languageName } from "@/lib/language-name"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useRevalidateOnForeground } from "@/lib/use-revalidate-on-foreground"
import { colors, radius, type as typeSize } from "@/lib/theme"

export default function ExpertsBrowseScreen() {
  const { t, i18n } = useTranslation("app")
  const { data, loading, error, revalidate } = useExpertProfiles()
  const profiles = data || []
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string | null>(null)
  const [language, setLanguage] = useState("")

  useFocusRevalidate(revalidate)
  useRevalidateOnForeground(revalidate)

  const categories = useMemo(
    () => [...new Set(profiles.map((p) => (p.category || "").trim()).filter(Boolean))].sort(),
    [profiles],
  )

  const languages = useMemo(() => [...new Set(profiles.flatMap((p) => p.languages ?? []))].sort(), [profiles])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return [...profiles]
      .filter((p) => !category || (p.category || "").trim() === category)
      .filter((p) => !language || (p.languages ?? []).includes(language))
      .filter(
        (p) =>
          !needle ||
          [p.display_name, p.headline, p.category].some((v) => (v || "").toLowerCase().includes(needle)),
      )
      .sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0
        return tb - ta
      })
  }, [profiles, query, category, language])

  const filtering = Boolean(query.trim() || category || language)
  const clear = () => {
    setQuery("")
    setCategory(null)
    setLanguage("")
  }

  return (
    <HubLinePageShell
      title={t("hub.expertsDirectoryTitle", { defaultValue: "All experts" })}
      subtitle={t("hub.expertsDirectorySubtitle", { defaultValue: "Browse every expert on Ciuna." })}
      backAriaLabel={t("hub.backToExperts", { defaultValue: "Back to experts" })}
      backHref="/experts"
    >
      <View style={styles.searchBox}>
        <Search size={18} color={colors.muted} strokeWidth={2} />
        <AppTextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("experts.directory.search", { defaultValue: "Search experts" })}
          placeholderTextColor="#9CA3AF"
          accessibilityLabel={t("experts.directory.search", { defaultValue: "Search experts" })}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} hitSlop={8} accessibilityRole="button" accessibilityLabel={t("common.clear", { defaultValue: "Clear" })}>
            <X size={18} color={colors.muted} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>

      {categories.length > 0 ? (
        <View style={styles.chips}>
          <FilterChips
            options={[{ id: "", label: t("experts.directory.all", { defaultValue: "All" }) }, ...categories.map((c) => ({ id: c, label: c }))]}
            value={category ?? ""}
            onChange={(id) => setCategory(id || null)}
          />
        </View>
      ) : null}

      {languages.length > 1 ? (
        <View style={styles.chips}>
          <FilterChips
            options={[{ id: "", label: t("experts.directory.allLanguages", { defaultValue: "All languages" }) }, ...languages.map((l) => ({ id: l, label: languageName(l, i18n.language) }))]}
            value={language}
            onChange={setLanguage}
          />
        </View>
      ) : null}

      {!loading && profiles.length > 0 ? (
        <View style={styles.countRow}>
          <Text style={styles.count}>{t("experts.directory.count", { count: filtered.length, defaultValue: "Experts: {{count}}" })}</Text>
          {filtering ? (
            <Pressable onPress={clear} hitSlop={8} accessibilityRole="button">
              <Text style={styles.clear}>{t("experts.directory.clear", { defaultValue: "Clear filters" })}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {loading && profiles.length === 0 ? (
        <View style={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={styles.skel} />
          ))}
        </View>
      ) : error && profiles.length === 0 ? (
        <LoadError onRetry={() => void revalidate()} />
      ) : profiles.length === 0 ? (
        <EmptyState title={t("hub.expertsEmpty", { defaultValue: "No experts listed yet." })} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t("experts.directory.noMatch", { defaultValue: "No experts match" })}
          body={t("experts.directory.noMatchBody", { defaultValue: "Try another name or category." })}
          actionLabel={t("experts.directory.clear", { defaultValue: "Clear filters" })}
          onAction={clear}
        />
      ) : (
        <View style={styles.grid}>
          {filtered.map((ex) => (
            <ExpertDirectoryCard key={ex.id} expert={ex} />
          ))}
        </View>
      )}
    </HubLinePageShell>
  )
}

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
  chips: { paddingBottom: 12 },
  countRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  count: { fontSize: typeSize.meta, color: colors.muted },
  clear: { fontSize: typeSize.meta, fontWeight: "700", color: colors.primaryText },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  skel: { width: "48.5%", aspectRatio: 0.85, marginBottom: 12, borderRadius: 16, backgroundColor: colors.paper },
})
