import { useState, type ReactNode } from "react"
import { Pressable, Share, StyleSheet, Text, View } from "react-native"
import * as Clipboard from "expo-clipboard"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Ban, Check, ChevronRight, Circle, CircleAlert, Copy, Flag, Undo2 } from "lucide-react-native"
import { SvgXml } from "react-native-svg"
import { Avatar } from "@/components/avatar"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useToast } from "@/components/toast-provider"
import { ApiError, authJson } from "@/lib/social-api"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { StatusChip } from "@/components/status-chip"
import { formatTimeZone, formatWhenZone } from "@/lib/format-date"
import { maskAccount } from "@/lib/mask-account"
import { formatMoney } from "@/lib/money"
import { statusTone } from "@/lib/transactions"
import { feePercent, formatRate, transferSteps, type TransferStep } from "@/lib/transfer-view"
import { NARROW_COLUMN } from "@/lib/layout-metrics"
import type { CombinedTransaction } from "@/lib/types"
import { colors, radius, shadows, type as typeSize } from "@/lib/theme"

/**
 * One transfer in full (CustomerTransferDetail card): what happened to the money first, the four-step timeline, the
 * amounts, the recipient, the payment, Report a problem, and pinned Share receipt and Repeat transfer.
 * `paySlot` holds the pay-now controls shown while the transfer waits for payment.
 */
export function TransferDetail({ tx, locale, flagSvg, paySlot, receiptSlot, onChanged }: { tx: CombinedTransaction; locale: string; flagSvg?: string | null; paySlot?: ReactNode; receiptSlot?: ReactNode; /** Called after the transfer changed (cancelled) so the screen reloads it. */ onChanged?: () => void }) {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { showError } = useToast()
  const [copied, setCopied] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const tone = statusTone(tx.status)
  // Cancelled because the payment window closed (not by the customer): its own wording.
  const cancelledAt = (tx.events || []).find((e) => e.status === "cancelled")?.created_at
  const timedOut = tone === "cancelled" && Boolean(tx.payment_expires_at) && (!cancelledAt || new Date(cancelledAt).getTime() >= new Date(tx.payment_expires_at as string).getTime() - 5000)
  const steps = transferSteps(tone, tx.created_at, tx.completed_at, tx.events)
  const name = tx.recipient?.full_name || ""
  const bank = tx.recipient?.bank_name || ""
  const sendCur = tx.send_currency || ""
  const recvCur = tx.receive_currency || ""
  const total = Number(tx.total_amount) || Number(tx.send_amount) || 0
  const fee = Number(tx.fee_amount) || 0
  const sent = Number(tx.send_amount) || 0
  const rate = Number(tx.exchange_rate)
  const pct = feePercent(fee, sent)
  const refundedLike = tone === "refunded"
  const heroAmount = tone === "pending" ? formatMoney(total, sendCur) : tone === "failed" || tone === "cancelled" || refundedLike ? formatMoney(total, sendCur) : formatMoney(tx.receive_amount, recvCur)
  const when = formatWhenZone(tx.completed_at && tone === "completed" ? tx.completed_at : tx.created_at, locale)
  const sub =
    timedOut
      ? t("transferDetail.timedOut.sub")
      : tone === "completed"
      ? t("transferDetail.sub.completed", { when, defaultValue: "Delivered {{when}}" })
      : tone === "pending"
        ? t("transferDetail.sub.pending", { amount: formatMoney(total, sendCur), defaultValue: "Pay {{amount}} to start your transfer." })
        : t(`transferDetail.sub.${tone}`)

  const label = (s: TransferStep) => {
    const k = ({ created: "created", payment: { waiting: "pWaiting", received: "pReceived", notReceived: "pNot" }, sent: { after: "sAfter", sending: "sSending", sent: "sSent", failed: "sFailed", notSent: "notSent" }, delivered: { default: "delivered", notSent: "notSent" }, refund: { onItsWay: "rWay", done: "rDone" } } as Record<string, string | Record<string, string>>)[s.key]
    const key = typeof k === "string" ? k : k[s.variant] || "notSent"
    return t(`transferDetail.step.${key}`, { bank: bank || t("txDetail.recipient"), name })
  }

  const copyRef = () => {
    void Clipboard.setStringAsync(tx.transaction_id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const heroTone = tone === "completed" ? "ok" : tone === "failed" ? "bad" : tone === "pending" || tone === "processing" ? "warn" : "neutral"
  const HeroIcon = tone === "completed" ? Check : tone === "failed" ? CircleAlert : refundedLike ? Undo2 : tone === "cancelled" ? Ban : Circle
  const tint = { ok: [colors.successSurface, colors.successText], bad: [colors.dangerSurface, colors.dangerText], warn: [colors.warningSurface, colors.warningText], neutral: [colors.neutralSurface, colors.neutralText] }[heroTone]

  const repeat = () =>
    router.push(
      (sendCur && recvCur
        ? { pathname: "/send", params: { from: sendCur, to: recvCur, amount: String(tx.send_amount ?? ""), ...(tx.recipient_id ? { recipient: tx.recipient_id } : {}) } }
        : "/send") as never,
    )
  const report = () =>
    router.push({ pathname: "/support/new", params: { topic: "transfer", subject: t("transferDetail.reportSubject", { id: tx.transaction_id }) } } as never)
  const share = () =>
    void Share.share({ message: t("txDetail.shareText", { id: tx.transaction_id, send: formatMoney(tx.send_amount, tx.send_currency), name, date: tx.created_at ? new Date(tx.created_at).toLocaleDateString(locale, { dateStyle: "medium" }) : "", defaultValue: "Ciuna transfer {{id}}: {{send}} sent to {{name}} on {{date}}." }) })

  const cancelTransfer = async () => {
    setCancelling(true)
    try {
      await authJson(`/api/transactions/${encodeURIComponent(tx.transaction_id)}/cancel`, { method: "POST", body: {} })
      setConfirmCancel(false)
      onChanged?.()
    } catch (e) {
      setConfirmCancel(false)
      showError(e instanceof ApiError && e.code === "TRANSFER_NOT_CANCELLABLE" ? t("transferDetail.cancel.paid") : t("transferDetail.cancel.failed"))
      onChanged?.()
    } finally {
      setCancelling(false)
    }
  }

  const canShare = tone === "completed"
  const showQuoteTotals = tone !== "cancelled"

  return (
    <View style={styles.flex}>
      <ScreenScroll edges={["left", "right"]} contentStyle={{ ...NARROW_COLUMN, paddingBottom: 24 }}>
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: tint[0] }]}>
            <HeroIcon size={24} color={tint[1]} strokeWidth={2.4} />
          </View>
          <StatusChip status={tx.status} />
          <Text style={styles.headline}>{timedOut ? t("transferDetail.timedOut.headline") : t(`transferDetail.headline.${tone}`, { name: name || t("txDetail.recipient") })}</Text>
          {tone === "pending" && paySlot ? null : <Text style={styles.heroAmount}>{heroAmount}</Text>}
          <Text style={styles.heroSub}>{sub}</Text>
          {tone === "failed" ? <Text style={styles.safe}>{t("transferDetail.safe")}</Text> : null}
        </View>

        {paySlot}

        {tone === "pending" ? (
          <View style={styles.cancelRow}>
            <PrimaryButton label={t("transferDetail.cancel.cta")} variant="secondary" onPress={() => setConfirmCancel(true)} />
          </View>
        ) : null}

        <View style={styles.card}>
          {steps.map((s, i) => (
            <View key={s.key} style={styles.stepRow}>
              <View style={styles.rail}>
                <View style={[styles.dot, dotStyle(s.state)]}>{s.state === "done" ? <Check size={11} color={colors.onPrimary} strokeWidth={3} /> : null}</View>
                {i < steps.length - 1 ? <View style={[styles.line, s.state === "done" && styles.lineDone]} /> : null}
              </View>
              <View style={styles.stepBody}>
                <Text style={[styles.stepLabel, s.state === "upcoming" && styles.muted, s.state === "failed" && styles.stepFailed]}>{label(s)}</Text>
                {s.time ? <Text style={styles.time}>{formatTimeZone(s.time, locale)}</Text> : null}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("transferDetail.amounts")}</Text>
          {showQuoteTotals ? (
            <>
              <Row label={t("transferDetail.sent")} value={formatMoney(sent, sendCur)} />
              {fee > 0 ? <Row label={pct ? t("transferDetail.feePct", { pct }) : t("transferDetail.fee")} value={formatMoney(fee, sendCur)} /> : null}
              {Number.isFinite(rate) && rate > 0 && sendCur && recvCur ? <Row label={t("transferDetail.rate")} value={`1 ${sendCur} = ${formatRate(rate)} ${recvCur}`} /> : null}
              {!refundedLike ? <Row label={t("transferDetail.gets")} value={formatMoney(tx.receive_amount, recvCur)} /> : null}
            </>
          ) : (
            <>
              <Row label={t("transferDetail.sent")} value={formatMoney(sent, sendCur)} />
              <Row label={t("transferDetail.gets")} value={formatMoney(tx.receive_amount, recvCur)} />
            </>
          )}
          <View style={styles.rule} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t("transferDetail.total")}</Text>
            <Text style={styles.totalValue}>{formatMoney(total, sendCur)}</Text>
          </View>
          {refundedLike ? <Row label={t("transferDetail.refunded")} value={`−${formatMoney(total, sendCur)}`} /> : null}
        </View>

        {tx.recipient ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("transferDetail.recipient")}</Text>
            <View style={styles.recipient}>
              <View>
                <Avatar name={name || "?"} size={48} />
                {flagSvg ? (
                  <View style={styles.flag}>
                    <SvgXml xml={flagSvg} width={18} height={12} />
                  </View>
                ) : null}
              </View>
              <View style={styles.flex}>
                <Text style={styles.recipientName} numberOfLines={1}>{name}</Text>
                <Text style={styles.muted} numberOfLines={1}>{[bank, tx.recipient.account_number ? maskAccount(tx.recipient.account_number) : ""].filter(Boolean).join(" · ")}</Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("transferDetail.payment")}</Text>
          {tx.payment_provider === "manual" || tx.payment_provider === "yookassa" || tx.payment_provider === "bitbanker" ? (
            <Row label={t("transferDetail.paidWith")} value={tx.payment_provider === "manual" ? t("receipt.method_bank", { defaultValue: "Bank transfer" }) : t("receipt.method_online", { defaultValue: "Online payment" })} />
          ) : null}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t("transferDetail.reference")}</Text>
            <Pressable onPress={copyRef} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${t("transferDetail.reference")} ${tx.transaction_id}`} style={styles.refBtn}>
              <Text style={styles.rowValue}>{tx.transaction_id}</Text>
              {copied ? <Check size={14} color={colors.success} strokeWidth={2.4} /> : <Copy size={14} color={colors.muted} strokeWidth={2} />}
              <Text style={styles.copied}>{copied ? t("transferDetail.copied") : ""}</Text>
            </Pressable>
          </View>
          {receiptSlot}
        </View>

        <Pressable onPress={report} accessibilityRole="button" style={styles.reportRow}>
          <Flag size={18} color={colors.muted} strokeWidth={2} />
          <View style={styles.flex}>
            <Text style={styles.reportTitle}>{t("transferDetail.report")}</Text>
            <Text style={styles.muted}>{t("transferDetail.reportHint")}</Text>
          </View>
          <ChevronRight size={18} color={colors.muted} />
        </Pressable>
      </ScreenScroll>

      <View style={styles.actionBar}>
        {canShare ? (
          <View style={styles.half}>
            <PrimaryButton label={t("transferDetail.share")} variant="secondary" onPress={share} />
          </View>
        ) : null}
        <View style={styles.half}>
          <PrimaryButton label={t("transferDetail.repeat")} variant={canShare ? "primary" : "secondary"} onPress={repeat} />
        </View>
      </View>
      <ConfirmDialog
        open={confirmCancel}
        title={t("transferDetail.cancel.title")}
        description={t("transferDetail.cancel.body")}
        confirmLabel={t("transferDetail.cancel.confirm")}
        cancelLabel={t("transferDetail.cancel.keep")}
        destructive
        busy={cancelling}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => void cancelTransfer()}
      />
    </View>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

function dotStyle(state: TransferStep["state"]) {
  if (state === "done") return { backgroundColor: colors.success, borderColor: colors.success }
  if (state === "current") return { backgroundColor: colors.surface, borderColor: colors.primary }
  if (state === "failed") return { backgroundColor: colors.surface, borderColor: colors.danger }
  if (state === "stopped") return { backgroundColor: colors.surface, borderColor: colors.neutralText }
  return { backgroundColor: colors.surface, borderColor: colors.cardEdge }
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  hero: { alignItems: "center", gap: 8, paddingTop: 8, paddingBottom: 20 },
  heroIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  headline: { fontSize: 20, fontWeight: "700", color: colors.text, textAlign: "center", marginTop: 4 },
  heroAmount: { fontSize: 32, fontWeight: "800", color: colors.text, fontVariant: ["tabular-nums"] },
  heroSub: { fontSize: typeSize.meta, color: colors.muted, textAlign: "center" },
  safe: { marginTop: 4, fontSize: typeSize.meta, fontWeight: "600", color: colors.dangerText, textAlign: "center" },
  card: { marginBottom: 14, padding: 16, gap: 10, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, ...shadows.face },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  stepRow: { flexDirection: "row", gap: 12, minHeight: 48 },
  rail: { width: 18, alignItems: "center" },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  line: { flex: 1, width: 2, backgroundColor: colors.cardEdge, marginVertical: 2 },
  lineDone: { backgroundColor: colors.success },
  stepBody: { flex: 1, paddingBottom: 12, gap: 2 },
  stepLabel: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  stepFailed: { color: colors.dangerText },
  muted: { fontSize: typeSize.meta, color: colors.muted },
  time: { fontSize: typeSize.meta, color: colors.muted },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  rowLabel: { fontSize: typeSize.body, color: colors.muted },
  rowValue: { fontSize: typeSize.body, fontWeight: "600", color: colors.text, fontVariant: ["tabular-nums"] },
  rule: { height: 2, backgroundColor: colors.text, marginTop: 4 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 16, fontWeight: "700", color: colors.text },
  totalValue: { fontSize: 20, fontWeight: "800", color: colors.text, fontVariant: ["tabular-nums"] },
  recipient: { flexDirection: "row", alignItems: "center", gap: 12 },
  recipientName: { fontSize: typeSize.body, fontWeight: "700", color: colors.text },
  flag: { position: "absolute", bottom: -2, right: -2, borderRadius: 3, overflow: "hidden", borderWidth: 1, borderColor: colors.paper },
  refBtn: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44 },
  copied: { fontSize: 12, color: colors.successText },
  reportRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, padding: 14, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  reportTitle: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  cancelRow: { marginBottom: 14 },
  actionBar: { flexDirection: "row", gap: 10, padding: 16, paddingBottom: 20, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  half: { flex: 1 },
})
