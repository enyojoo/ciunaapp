import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { Check, ChevronDown, MapPin } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { RU_CITIES, RU_POPULAR_CITIES, ruCityLabel, sameCity, searchRuCities } from "@ciuna/shared"
import { DirectorySearch } from "@/components/directory-filters"
import { PressableScale } from "@/components/ui/pressable-scale"
import { Sheet } from "@/components/ui/sheet"
import { useDeliveryCities, useLocationCity } from "@/lib/location"
import { colors, radius, type as typeSize } from "@/lib/theme"

/**
 * Header control for Food, Mart and Experts: the chosen city (or "Location") with a pin. Tapping it opens a sheet with
 * every Russian city of 100,000+ people, searchable in English or Russian. Nothing to type to start: cities where stores
 * deliver come first, then the biggest cities, then A to Z. The choice is shared by all three lines.
 */
export function LocationPill() {
  const { t, i18n } = useTranslation("app")
  const { city, setCity } = useLocationCity()
  const delivering = useDeliveryCities()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const lang = i18n.language || "en"
  const label = city ? ruCityLabel(city, lang) : t("hub.locationLabel", { defaultValue: "Location" })

  const close = () => {
    setOpen(false)
    setQuery("")
  }
  const choose = (next: string | null) => {
    void setCity(next)
    close()
  }

  const sections = useMemo(() => {
    if (query.trim()) return [{ key: "results", title: "", cities: searchRuCities(query).map((c) => c.en) }]
    const out: { key: string; title: string; cities: string[] }[] = []
    if (delivering.length > 0) out.push({ key: "delivering", title: t("hub.locationDelivering", { defaultValue: "Delivery available" }), cities: delivering })
    const rest = (list: string[]) => list.filter((c) => !delivering.some((d) => sameCity(d, c)))
    const popular = rest(RU_POPULAR_CITIES.map((c) => c.en))
    if (popular.length > 0) out.push({ key: "popular", title: t("hub.locationPopular", { defaultValue: "Popular" }), cities: popular })
    out.push({
      key: "all",
      title: t("hub.locationAllCities", { defaultValue: "All cities" }),
      cities: rest(RU_CITIES.map((c) => c.en)).filter((c) => !popular.includes(c)).sort((a, b) => ruCityLabel(a, lang).localeCompare(ruCityLabel(b, lang), lang)),
    })
    return out
  }, [query, delivering, lang, t])

  const noResults = query.trim() && sections[0].cities.length === 0

  return (
    <>
      <PressableScale
        onPress={() => {
          setQuery("")
          setOpen(true)
        }}
        haptics
        scaleTo={0.96}
        accessibilityRole="button"
        accessibilityLabel={`${t("hub.locationLabel", { defaultValue: "Location" })}: ${city ? ruCityLabel(city, lang) : t("hub.locationAll", { defaultValue: "All areas" })}`}
        hitSlop={6}
        style={styles.pill}
      >
        <MapPin size={16} color={colors.text} strokeWidth={2.2} />
        <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
          {label}
        </Text>
        <ChevronDown size={14} color={colors.muted} strokeWidth={2.4} />
      </PressableScale>
      <Sheet open={open} title={t("hub.locationTitle", { defaultValue: "Choose your area" })} onClose={close} size="tall">
        <Text style={styles.hint}>
          {t("hub.locationHint", { defaultValue: "We show stores that deliver to the city you pick, plus pickup-only stores and digital items." })}
        </Text>
        <DirectorySearch value={query} onChange={setQuery} placeholder={t("hub.locationSearch", { defaultValue: "Search cities" })} />
        {!query.trim() ? <Row label={t("hub.locationAll", { defaultValue: "All areas" })} selected={!city} onPress={() => choose(null)} /> : null}
        {sections.map((sec) => (
          <View key={sec.key}>
            {sec.title ? <Text style={styles.section}>{sec.title}</Text> : null}
            {sec.cities.map((c) => (
              <Row key={sec.key + c} label={ruCityLabel(c, lang)} selected={sameCity(city, c)} onPress={() => choose(c)} />
            ))}
          </View>
        ))}
        {noResults ? <Text style={styles.empty}>{t("hub.noMatch", { defaultValue: "No matches" })}</Text> : null}
      </Sheet>
    </>
  )
}

function Row({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }} style={styles.row}>
      <Text style={[styles.rowLabel, selected && styles.rowLabelOn]}>{label}</Text>
      {selected ? <Check size={20} color={colors.primary} strokeWidth={2.4} /> : <View style={styles.checkSpace} />}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 36,
    width: 124,
    flexShrink: 1,
    paddingHorizontal: 10,
    marginRight: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  label: { flex: 1, minWidth: 0, fontSize: typeSize.meta, fontWeight: "600", color: colors.text },
  hint: { fontSize: typeSize.meta, lineHeight: 18, color: colors.muted, marginBottom: 12 },
  section: { marginTop: 16, marginBottom: 4, fontSize: typeSize.caption, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase", color: colors.muted },
  empty: { paddingVertical: 12, fontSize: typeSize.body, color: colors.muted },
  row: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowLabel: { fontSize: typeSize.body, color: colors.text },
  rowLabelOn: { fontWeight: "700" },
  checkSpace: { width: 20 },
})
