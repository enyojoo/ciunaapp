import { type ReactNode } from "react"
import { StyleSheet } from "react-native"
import { PressableScale } from "@/components/ui/pressable-scale"
import { colors } from "@/lib/theme"

/** 44 pt round icon control: back, share, favourite, close. Always give it an accessibility label. */
export function IconButton({
  children,
  onPress,
  label,
  tone = "plain",
  size = 44,
}: {
  children: ReactNode
  onPress?: () => void
  label: string
  /** `plain` has a hairline ring on the page; `overlay` is a white disc for use over photos. */
  tone?: "plain" | "overlay"
  size?: number
}) {
  return (
    <PressableScale
      onPress={onPress}
      haptics
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={[styles.base, { width: size, height: size, borderRadius: size / 2 }, tone === "overlay" ? styles.overlay : styles.plain]}
    >
      {children}
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center" },
  plain: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  overlay: { backgroundColor: "rgba(255,255,255,0.94)" },
})
