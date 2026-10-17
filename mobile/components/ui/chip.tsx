import { ScrollView, StyleSheet } from "react-native"
import { AppText } from "@/components/ui/app-text"
import { PressableScale } from "@/components/ui/pressable-scale"
import { haptic } from "@/lib/haptics"
import { colors, radius, space } from "@/lib/theme"

/** Single-choice pill. The selected chip is the only filled one (ink, not orange); selection gives a tick of haptic. */
export function Chip({ label, selected, onPress, count }: { label: string; selected?: boolean; onPress?: () => void; count?: number }) {
  return (
    <PressableScale
      onPress={() => {
        haptic.selection()
        onPress?.()
      }}
      scaleTo={0.96}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      hitSlop={{ top: 4, bottom: 4 }}
      style={[styles.chip, selected && styles.on]}
    >
      <AppText variant="label" tone={selected ? "onSelected" : "default"} numberOfLines={1}>
        {count != null ? `${label} · ${count}` : label}
      </AppText>
    </PressableScale>
  )
}

export type ChipOption<T extends string> = { id: T; label: string; count?: number }

/** Horizontal row of chips. Bleeds to the screen edge when the parent has page padding (pass `inset`). */
export function ChipRow<T extends string>({
  options,
  value,
  onChange,
  inset = space.gutter,
  accessibilityLabel,
}: {
  options: ChipOption<T>[]
  value: T
  onChange: (id: T) => void
  /** Horizontal padding inside the scroller so the first chip lines up with the page gutter. */
  inset?: number
  accessibilityLabel?: string
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.row, { paddingHorizontal: inset }]} accessibilityLabel={accessibilityLabel}>
      {options.map((o) => (
        <Chip key={o.id} label={o.label} count={o.count} selected={o.id === value} onPress={() => onChange(o.id)} />
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: { gap: space.sm, paddingVertical: space.xs },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.inputEdge,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  on: { backgroundColor: colors.selected, borderColor: colors.selected },
})
