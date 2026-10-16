import { Pressable, ScrollView, StyleSheet, Text } from "react-native"
import { colors } from "@/lib/theme"

export type FilterChipOption<T extends string> = { id: T; label: string; count?: number }

/**
 * One horizontal row of single-choice chips. The selected chip is the only filled one (primary
 * fill, white label). Use it for categories, result groups and any other short filter list.
 */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: FilterChipOption<T>[]
  value: T
  onChange: (id: T) => void
  ariaLabel?: string
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityLabel={ariaLabel}
    >
      {options.map((o) => {
        const on = o.id === value
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[styles.chip, on && styles.chipOn]}
          >
            <Text style={[styles.text, on && styles.textOn]} numberOfLines={1}>
              {o.count != null ? `${o.label} · ${o.count}` : o.label}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingBottom: 4 },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.inputEdge,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { fontSize: 14, fontWeight: "600", color: colors.text },
  textOn: { color: colors.onPrimary },
})
