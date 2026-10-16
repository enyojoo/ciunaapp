import { StyleSheet, View } from "react-native"
import { Star } from "lucide-react-native"
import { colors } from "@/lib/theme"

const EMPTY = "#D1D5DB"

/** Read-only stars. Filled stars use the orange text colour on white; empty ones are hairline grey outlines. */
export function RatingStars({ value, size = 14 }: { value: number; size?: number }) {
  const rounded = Math.round(value)
  return (
    <View style={styles.row} accessible accessibilityRole="image" accessibilityLabel={`${value.toFixed(1)} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          strokeWidth={2}
          color={n <= rounded ? colors.primaryText : EMPTY}
          fill={n <= rounded ? colors.primaryText : "transparent"}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({ row: { flexDirection: "row", gap: 2, alignItems: "center" } })
