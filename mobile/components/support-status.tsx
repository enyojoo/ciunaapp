import { StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { radius, colors, type as typeSize } from "@/lib/theme"

export type SupportStatus = "open" | "awaiting_customer" | "resolved"

const TONE: Record<SupportStatus, { bg: string; fg: string }> = {
  open: { bg: colors.warningSurface, fg: colors.warningText },
  awaiting_customer: { bg: colors.warningSurface, fg: colors.warningText },
  resolved: { bg: colors.successSurface, fg: colors.success },
}

/** Request status in the system's words: In review and Awaiting you are warning, Resolved is success. */
export function SupportStatusBadge({ status }: { status: SupportStatus }) {
  const { t } = useTranslation("app")
  const tone = TONE[status] ?? TONE.open
  const text =
    status === "resolved"
      ? t("support.req.resolved", { defaultValue: "Resolved" })
      : status === "awaiting_customer"
        ? t("support.req.statusAwaiting", { defaultValue: "Awaiting you" })
        : t("support.req.statusOpen", { defaultValue: "In review" })
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.fg }]}>{text}</Text>
    </View>
  )
}

/** Maps an API error code to a readable message, with a generic fallback. */
export function supportErrorText(t: (k: string, o?: Record<string, unknown>) => string, code: string | undefined): string {
  switch (code) {
    case "SUPPORT_TOO_MANY_OPEN":
    case "SUPPORT_CLOSED":
    case "RATE_LIMITED":
      return t(`support.req.err_${code}`)
    case "SUPPORT_SUBJECT_INVALID":
      return t("support.req.err_SUBJECT")
    case "MESSAGE_EMPTY":
      return t("support.req.err_EMPTY")
    default:
      return t("support.req.err_GENERIC")
  }
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  text: { fontSize: typeSize.caption, fontWeight: "600" },
})
