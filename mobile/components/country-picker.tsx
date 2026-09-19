import { useMemo, useState } from "react"
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Search, X } from "lucide-react-native"
import { FlagIcon } from "@/components/flag-icon"
import { colors, radius, type as typeSize } from "@/lib/theme"
import type { Country } from "@/lib/country-service"

export function CountryPicker({
  open,
  title,
  searchPlaceholder,
  countries,
  selectedCode,
  onSelect,
  onClose,
}: {
  open: boolean
  title: string
  searchPlaceholder: string
  countries: Country[]
  selectedCode?: string | null
  onSelect: (country: Country) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return countries
    return countries.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
  }, [countries, query])

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <SafeAreaView edges={["bottom"]} style={styles.sheet}>
          <View style={styles.head}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} style={styles.close} accessibilityLabel="Close">
              <X size={20} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.searchBox}>
            <Search size={16} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={searchPlaceholder}
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
            />
          </View>
          <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
            {filtered.map((c) => {
              const selected = selectedCode === c.code
              return (
                <Pressable
                  key={c.code}
                  onPress={() => {
                    onSelect(c)
                    onClose()
                  }}
                  style={styles.item}
                >
                  <FlagIcon code={c.code} size={20} />
                  <Text style={[styles.itemText, selected && styles.itemSelected]}>{c.name}</Text>
                </Pressable>
              )
            })}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { height: "80%", borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.paper },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 18, fontWeight: "600", color: colors.text },
  close: { height: 44, width: 44, alignItems: "center", justifyContent: "center" },
  searchBox: {
    marginHorizontal: 20,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: typeSize.body, color: colors.text, paddingVertical: 10 },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  item: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: 12,
  },
  itemText: { flex: 1, fontSize: typeSize.body, color: colors.text },
  itemSelected: { fontWeight: "600", color: colors.primary },
})
