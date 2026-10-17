import { type ReactNode } from "react"
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native"
import { PressableScale } from "@/components/ui/pressable-scale"
import { colors, elevation, radius, space } from "@/lib/theme"

/**
 * White plate on the paper canvas. `flat` has a hairline edge; `raised` adds the card shadow (product cards,
 * hero blocks). Pass `onPress` to make the whole card a button with press feedback.
 */
export function Card({
  children,
  onPress,
  elevated,
  padded = true,
  style,
  accessibilityLabel,
}: {
  children: ReactNode
  onPress?: () => void
  elevated?: boolean
  padded?: boolean
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
}) {
  const body = [styles.card, elevated ? styles.raised : styles.flat, padded && styles.padded, style]
  if (!onPress) return <View style={body}>{children}</View>
  return (
    <PressableScale onPress={onPress} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={body}>
      {children}
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.card, overflow: "hidden" },
  flat: { borderWidth: 1, borderColor: colors.border },
  raised: { borderWidth: 1, borderColor: colors.cardEdge, ...elevation.raised },
  padded: { padding: space.lg },
})
