import { type ReactNode } from "react"
import { StyleSheet, View } from "react-native"
import { AlertTriangle, CircleCheck, CircleX, Info } from "lucide-react-native"
import { AppText } from "@/components/ui/app-text"
import { colors, radius, space } from "@/lib/theme"

type Tone = "info" | "success" | "warning" | "danger"

const TONE: Record<Tone, { bg: string; border: string; fg: string; Icon: typeof Info }> = {
  info: { bg: colors.neutralSurface, border: colors.border, fg: colors.neutralText, Icon: Info },
  success: { bg: colors.successSurface, border: colors.successBorder, fg: colors.successText, Icon: CircleCheck },
  warning: { bg: colors.warningSurface, border: colors.warningBorder, fg: colors.warningText, Icon: AlertTriangle },
  danger: { bg: colors.dangerSurface, border: colors.dangerBorder, fg: colors.dangerText, Icon: CircleX },
}

/** Inline message that stays on the page: a deadline, a limit, a failed load. Say what to do, not just what went wrong. */
export function Banner({ tone = "info", title, body, action }: { tone?: Tone; title: string; body?: string; action?: ReactNode }) {
  const c = TONE[tone]
  return (
    <View accessibilityRole="alert" style={[styles.box, { backgroundColor: c.bg, borderColor: c.border }]}>
      <c.Icon size={20} color={c.fg} strokeWidth={2.2} />
      <View style={styles.text}>
        <AppText variant="label" style={{ color: c.fg }}>
          {title}
        </AppText>
        {body ? (
          <AppText variant="meta" style={{ color: c.fg }}>
            {body}
          </AppText>
        ) : null}
        {action}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  box: { flexDirection: "row", alignItems: "flex-start", gap: space.md, borderRadius: radius.card, borderWidth: 1, padding: space.lg },
  text: { flex: 1, gap: 2 },
})
