import { useEffect, type ReactNode } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Check, X } from "lucide-react-native"
import { formatExchangeRateDisplay } from "@ciuna/shared"
import { InlineSkeleton } from "@/components/inline-skeleton"
import { formatMoney } from "@/lib/money"
import type { SendFlowStep } from "@/components/send/send-step-progress"
import { colors, radius, shadows, type as typeSize } from "@/lib/theme"

const STEPS: { key: "amount" | "recipient" | "review" | "pay"; flow: SendFlowStep | null }[] = [
  { key: "amount", flow: "amount" },
  { key: "recipient", flow: "recipient" },
  { key: "review", flow: "pay" },
  { key: "pay", flow: null },
]

/** The four steps on wide screens: Amount, Recipient, Review, Pay. Pay is the screen that follows (the order). */
export function SendStepper({ step }: { step: SendFlowStep }) {
  const { t } = useTranslation("app")
  const current = STEPS.findIndex((s) => s.flow === step)
  return (
    <View style={styles.stepper} accessibilityRole="list">
      {STEPS.map((s, i) => {
        const done = i < current
        const on = i === current
        return (
          <View key={s.key} style={styles.stepItem} accessibilityRole="text" accessibilityLabel={`${i + 1}. ${t(`send.steps.${s.key}`)}`}>
            <View style={[styles.stepDot, done && styles.stepDone, on && styles.stepOn]}>
              {done ? <Check size={14} color={colors.onPrimary} strokeWidth={3} /> : <Text style={[styles.stepNum, on && styles.stepNumOn]}>{i + 1}</Text>}
            </View>
            <Text style={[styles.stepLabel, (on || done) && styles.stepLabelOn]}>{t(`send.steps.${s.key}`, { defaultValue: s.key })}</Text>
            {i < STEPS.length - 1 ? <View style={[styles.stepLine, done && styles.stepLineDone]} /> : null}
          </View>
        )
      })}
    </View>
  )
}

/** Form on the left, the live quote on the right; the quote stays in place through every step. */
export function SendDesktopFrame({ aside, children }: { aside: ReactNode; children: ReactNode }) {
  return (
    <View style={styles.frame}>
      <View style={styles.main}>{children}</View>
      <View style={styles.aside}>{aside}</View>
    </View>
  )
}

export type AsideLimit = { currency: string; monthly_amount: number; used: number; remaining: number; resetsAt: string }

export function SendQuoteAside({
  sendAmount,
  sendCurrency,
  receiveCurrency,
  quote,
  processingFeeAmount,
  feePending,
  hidden,
  limit,
  onSeeLimits,
  locale,
}: {
  sendAmount: string
  sendCurrency: string
  receiveCurrency: string
  quote: { rate: number; receiveAmount: number; totalAmount: number } | null
  processingFeeAmount: number
  feePending?: boolean
  /** True while the amount cannot be sent (a limit): the quote is hidden and says why. */
  hidden?: boolean
  limit: AsideLimit | null
  onSeeLimits: () => void
  locale: string
}) {
  const { t } = useTranslation("app")
  const show = Boolean(quote) && !hidden
  const used = limit ? Math.min(100, Math.round((limit.used / limit.monthly_amount) * 100)) : 0
  return (
    <>
      <View style={styles.plate}>
        {show && quote ? (
          <>
            <Row label={t("send.aside.rate", { defaultValue: "Exchange rate" })} value={`1 ${sendCurrency} = ${formatExchangeRateDisplay(quote.rate)} ${receiveCurrency}`} />
            <Text style={styles.live}>{t("send.aside.live", { defaultValue: "Live rate" })}</Text>
            <View style={styles.rule} />
            <Row label={t("send.aside.sent", { defaultValue: "You send" })} value={formatMoney(Number(sendAmount) || 0, sendCurrency)} />
            <View style={styles.row}>
              <Text style={styles.label}>{t("send.aside.fee", { defaultValue: "Processing fee" })}</Text>
              {feePending ? <InlineSkeleton width={72} height={16} /> : <Text style={styles.value}>{processingFeeAmount > 0 ? formatMoney(processingFeeAmount, sendCurrency) : t("send.free", { defaultValue: "Free" })}</Text>}
            </View>
            <Row label={t("send.aside.gets", { defaultValue: "Recipient gets" })} value={formatMoney(quote.receiveAmount, receiveCurrency)} />
            <View style={styles.rule} />
            <View style={styles.row}>
              <Text style={styles.totalLabel}>{t("send.aside.total", { defaultValue: "Total to pay" })}</Text>
              <Text style={styles.totalValue}>{formatMoney(quote.totalAmount, sendCurrency)}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.empty}>{t("send.aside.enter", { defaultValue: "Enter an amount within your limit to see the fee and total." })}</Text>
        )}
      </View>

      {limit ? (
        <View style={styles.plate}>
          <Text style={styles.plateTitle}>{t("send.aside.limitTitle", { defaultValue: "Your limit this month" })}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${used}%` }, limit.remaining <= 0 && styles.barFull]} />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t("send.aside.left", { defaultValue: "Left to send" })}</Text>
            <Text style={styles.value}>{formatMoney(limit.remaining, limit.currency)}</Text>
          </View>
          <Text style={styles.live}>{t("send.aside.resets", { date: new Date(limit.resetsAt).toLocaleDateString(locale, { dateStyle: "medium" }), defaultValue: "Resets {{date}}" })}</Text>
          <Pressable onPress={onSeeLimits} accessibilityRole="link" style={styles.linkHit}>
            <Text style={styles.link}>{t("send.seeLimits", { defaultValue: "See limits" })}</Text>
          </Pressable>
        </View>
      ) : null}
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  stepper: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  stepItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.cardEdge, backgroundColor: colors.surface },
  stepDone: { backgroundColor: colors.success, borderColor: colors.success },
  stepOn: { borderColor: colors.primary },
  stepNum: { fontSize: typeSize.meta, fontWeight: "700", color: colors.muted },
  stepNumOn: { color: colors.primaryText },
  stepLabel: { fontSize: typeSize.meta, fontWeight: "600", color: colors.muted },
  stepLabelOn: { color: colors.text },
  stepLine: { flex: 1, height: 2, marginHorizontal: 8, backgroundColor: colors.cardEdge },
  stepLineDone: { backgroundColor: colors.success },
  frame: { flexDirection: "row", alignItems: "flex-start", gap: 24 },
  main: { flex: 1, minWidth: 0 },
  aside: { width: 380, gap: 16 },
  plate: { padding: 16, gap: 10, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, ...shadows.face },
  plateTitle: { fontSize: typeSize.meta, fontWeight: "700", color: colors.text },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  label: { fontSize: typeSize.body, color: colors.muted },
  value: { fontSize: typeSize.body, fontWeight: "600", color: colors.text, fontVariant: ["tabular-nums"] },
  live: { fontSize: typeSize.caption, color: colors.muted },
  rule: { height: 1, backgroundColor: colors.border },
  totalLabel: { fontSize: typeSize.body, fontWeight: "700", color: colors.text },
  totalValue: { fontSize: typeSize.headline, fontWeight: "800", color: colors.text, fontVariant: ["tabular-nums"] },
  empty: { fontSize: typeSize.body, color: colors.muted, lineHeight: 22 },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.neutralSurface, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  barFull: { backgroundColor: colors.danger },
  linkHit: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  link: { fontSize: typeSize.meta, fontWeight: "700", color: colors.primaryText, textDecorationLine: "underline" },
})

/** A 460px panel over a scrim (desktop web). Escape and the close button close it; the step keeps its data. */
export function SidePanel({ open, title, closeLabel, onClose, children }: { open: boolean; title: string; closeLabel: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open || typeof window === "undefined") return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <View style={panelStyles.root} pointerEvents="box-none">
      <Pressable style={panelStyles.scrim} onPress={onClose} accessibilityLabel={closeLabel} />
      <View style={panelStyles.panel} accessibilityViewIsModal>
        <View style={panelStyles.head}>
          <Text style={panelStyles.title} accessibilityRole="header">{title}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={closeLabel} hitSlop={8} style={panelStyles.close}>
            <X size={20} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={panelStyles.body}>{children}</ScrollView>
      </View>
    </View>
  )
}

const panelStyles = StyleSheet.create({
  // Desktop web only: fixed to the window so the panel covers the whole page, not just the content column.
  root: { position: "fixed" as unknown as "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, flexDirection: "row", justifyContent: "flex-end" },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(17,24,39,0.45)" },
  panel: { width: 460, maxWidth: "100%", height: "100%", backgroundColor: colors.paper, borderLeftWidth: 1, borderLeftColor: colors.border },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  title: { fontSize: typeSize.headline, fontWeight: "700", color: colors.text },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  body: { padding: 16, gap: 12 },
})
