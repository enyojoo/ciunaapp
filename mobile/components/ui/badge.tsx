import { type ReactNode } from "react"
import { StyleSheet, View } from "react-native"
import { AppText } from "@/components/ui/app-text"
import { colors, radius } from "@/lib/theme"

export type BadgeTone = "success" | "warning" | "danger" | "neutral" | "primary"

const TONE: Record<BadgeTone, { bg: string; fg: string }> = {
  success: { bg: colors.successSurface, fg: colors.successText },
  warning: { bg: colors.warningSurface, fg: colors.warningText },
  danger: { bg: colors.dangerSurface, fg: colors.dangerText },
  neutral: { bg: colors.neutralSurface, fg: colors.neutralText },
  primary: { bg: colors.primaryTint, fg: colors.primaryText },
}

/**
 * Status or label pill. Carries a word, and an icon where it is a status, so colour is never the only signal.
 * Orange (`primary`) is for emphasis such as "New", never for a status.
 */
export function Badge({ label, tone = "neutral", icon }: { label: string; tone?: BadgeTone; icon?: (color: string) => ReactNode }) {
  const c = TONE[tone]
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      {icon?.(c.fg)}
      <AppText variant="caption" style={{ color: c.fg }} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
})
