import { type ReactNode } from "react"
import { ActivityIndicator, StyleSheet, View } from "react-native"
import { AppText } from "@/components/ui/app-text"
import { PressableScale } from "@/components/ui/pressable-scale"
import { colors, radius, space } from "@/lib/theme"

export type ButtonVariant = "primary" | "secondary" | "tinted" | "ghost" | "destructive" | "dangerGhost"
export type ButtonSize = "sm" | "md" | "lg"

const HEIGHT: Record<ButtonSize, number> = { sm: 36, md: space.tap, lg: 56 }

/**
 * The one button. Primary is the single filled action on a screen; secondary is outlined; tinted is a soft
 * orange for secondary emphasis; ghost is text only; destructive is for irreversible actions; dangerGhost is red text only. Busy keeps the
 * label width so the layout does not jump. `md` is the 48 pt touch target.
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  leading,
  busy,
  disabled,
  fullWidth = true,
  haptics = true,
  accessibilityHint,
}: {
  label: string
  onPress?: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  leading?: ReactNode
  busy?: boolean
  disabled?: boolean
  fullWidth?: boolean
  haptics?: boolean
  accessibilityHint?: string
}) {
  const dimmed = disabled || busy
  // A disabled filled button turns neutral (grey fill, muted label) so it never reads as a faded call to action.
  // Busy keeps its colours: the action is running, not unavailable.
  const neutral = disabled && !busy && (variant === "primary" || variant === "destructive")
  const fg = neutral ? colors.muted : FG[variant]
  return (
    <PressableScale
      onPress={onPress}
      disabled={dimmed}
      haptics={haptics && variant !== "ghost" && variant !== "dangerGhost"}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(dimmed), busy: Boolean(busy) }}
      style={[styles.base, { minHeight: HEIGHT[size] }, fullWidth ? styles.full : styles.hug, neutral ? styles.neutral : BG[variant], dimmed && !neutral && styles.dimmed]}
    >
      {busy ? <ActivityIndicator color={fg} /> : null}
      <View style={[styles.content, busy && styles.hidden]}>
        {leading}
        <AppText variant={size === "sm" ? "meta" : "bodyStrong"} style={[{ color: fg }, size === "sm" && { fontWeight: "600" }, styles.label]} numberOfLines={2}>
          {label}
        </AppText>
      </View>
    </PressableScale>
  )
}

const FG: Record<ButtonVariant, string> = {
  primary: colors.onPrimary,
  secondary: colors.text,
  tinted: colors.primaryText,
  ghost: colors.primaryText,
  destructive: colors.onPrimary,
  dangerGhost: colors.dangerText,
}

const BG = StyleSheet.create({
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.inputEdge },
  tinted: { backgroundColor: colors.primaryTint },
  ghost: { backgroundColor: "transparent" },
  destructive: { backgroundColor: colors.danger },
  dangerGhost: { backgroundColor: "transparent" },
})

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.control,
    paddingHorizontal: space.lg,
  },
  full: { width: "100%" },
  hug: { alignSelf: "flex-start" },
  content: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm },
  label: { flexShrink: 1, textAlign: "center" },
  hidden: { position: "absolute", opacity: 0 },
  dimmed: { opacity: 0.5 },
  neutral: { backgroundColor: colors.fill },
})
