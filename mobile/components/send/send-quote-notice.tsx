import { StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { AlertCircle, Info } from "lucide-react-native"
import type { SendQuotePreviewNotice } from "@/lib/bitbanker-quote-notice"
import { colors, radius, type as typeSize } from "@/lib/theme"

const DEFAULT_COPY: Record<string, string> = {
  "send.mobile.quoteFeesUnavailable": "Couldn't confirm the fee. Try again.",
  "send.mobile.quoteBelowMinRub": "Send at least 1,000 RUB.",
  "send.mobile.quoteMinContribution": "Send a higher amount to continue.",
  "send.quoteDeskRateNotConfigured": "This corridor isn't ready for RUB sends yet.",
  "send.quoteMinContribution": "Send a higher amount to continue.",
  "send.mobile.verifyRequired": "Complete verification to send.",
  "send.rateUnavailable": "No exchange rate for this pair.",
  "send.min": "Min: {{amount}}",
}

export function SendQuoteNotice({ notice }: { notice: SendQuotePreviewNotice }) {
  const { t } = useTranslation("app")
  const warning = notice.kind === "warning"
  const Icon = warning ? AlertCircle : Info
  const fallback = DEFAULT_COPY[notice.messageKey] ?? "Something went wrong. Try again."
  const message = t(notice.messageKey, {
    defaultValue: fallback,
    ...(notice.messageParams ?? {}),
  })

  return (
    <View style={[styles.box, warning ? styles.boxWarning : styles.boxInfo]}>
      <Icon size={16} color={warning ? colors.danger : colors.muted} strokeWidth={2.2} />
      <Text style={[styles.text, warning ? styles.textWarning : styles.textInfo]}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.row,
    borderWidth: StyleSheet.hairlineWidth,
  },
  boxInfo: {
    borderColor: colors.border,
    backgroundColor: colors.paper,
  },
  boxWarning: {
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  text: { flex: 1, fontSize: typeSize.meta, lineHeight: 18 },
  textInfo: { color: colors.muted },
  textWarning: { color: "#991B1B" },
})
