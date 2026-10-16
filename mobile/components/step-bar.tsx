import { StyleSheet, Text, View } from "react-native"
import { colors, type as typeSize } from "@/lib/theme"

/**
 * A row of progress segments with a label under each. Segments up to and including `active` are filled.
 * Used for checkout (Details, Review) and expert bookings (Time, Details, Review).
 */
export function StepBar({ steps, active }: { steps: string[]; active: number }) {
  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: steps.length, now: active + 1 }}>
      {steps.map((label, i) => (
        <View key={label} style={styles.step}>
          <View style={[styles.bar, i <= active && styles.barOn]} />
          <Text style={[styles.label, i <= active && styles.labelOn]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginBottom: 16 },
  step: { flex: 1, gap: 6 },
  bar: { height: 4, borderRadius: 2, backgroundColor: colors.border },
  barOn: { backgroundColor: colors.primary },
  label: { fontSize: typeSize.meta - 1, fontWeight: "600", color: colors.muted },
  labelOn: { color: colors.text },
})
