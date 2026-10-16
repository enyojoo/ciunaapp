import { Pressable, StyleSheet, View } from "react-native"
import { useTranslation } from "react-i18next"
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

/**
 * Tappable stars for giving a rating. Each star is a 48px target; the chosen rating and every star below it
 * are filled, so the state never depends on colour alone. `locked` makes it read-only.
 */
export function RatingInput({ value, onChange, locked }: { value: number; onChange: (n: number) => void; locked?: boolean }) {
  const { t } = useTranslation("app")
  return (
    <View style={styles.input} accessibilityRole="radiogroup">
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          disabled={locked}
          onPress={() => onChange(n)}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === n }}
          accessibilityLabel={t("reviews.starsAria", { n, defaultValue: "{{n}} of 5 stars" })}
          style={styles.hit}
        >
          <Star size={34} strokeWidth={1.8} color={n <= value ? colors.primaryText : EMPTY} fill={n <= value ? colors.primaryText : "transparent"} />
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 2, alignItems: "center" },
  input: { flexDirection: "row", justifyContent: "center", gap: 4 },
  hit: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
})
