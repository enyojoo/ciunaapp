import type { MarketplaceOrder } from "@ciuna/shared"
import { MarketplaceOrderView } from "@/components/marketplace-checkout"
import { useEffect, useRef, useState } from "react"
import * as Clipboard from "expo-clipboard"
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, View } from "react-native"
import { StatusBar } from "expo-status-bar"
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import {
  Check,
  Clock,
  Copy,
  FileCheck,
  MapPin,
  Package2,
  Phone,
  UserRound,
  XCircle,
} from "lucide-react-native"
import { SvgXml } from "react-native-svg"
import { Avatar } from "@/components/avatar"
import { EmptyState } from "@/components/empty-state"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { TransactionTimeline } from "@/components/transaction-timeline"
import { useToast } from "@/components/toast-provider"
import { apiUrl, fetchWithAuth } from "@/lib/api"
import { openInAppBrowser } from "@/lib/in-app-browser"
import { formatMoney } from "@/lib/money"
import { formatDateTimeLine, isHubTransaction, isReferralPayout, statusTone } from "@/lib/transactions"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useFx } from "@/lib/use-fx"
import { useRevalidateOnForeground } from "@/lib/use-revalidate-on-foreground"
import { useTransaction } from "@/lib/use-transaction"
import { colors, radius, type as typeSize } from "@/lib/theme"
import type { CombinedTransaction } from "@/lib/types"

type HubSnapshot = {
  productTitle?: string
  fundedAmount?: number
  fundedCurrency?: string
  feePercent?: number | null
  items?: { title: string; quantity: number; lineTotal: number }[]
  contactName?: string
  contactPhone?: string
  fulfillmentType?: "online" | "in_person" | "vendor"
  deliveryAddressLine?: string | null
  formAnswers?: Record<string, unknown>
}

function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

function hubFeeReceiveAmount(tx: CombinedTransaction, snap?: HubSnapshot): number {
  const productPrice =
    snap?.fundedAmount != null && Number.isFinite(Number(snap.fundedAmount))
      ? Number(snap.fundedAmount)
      : Number(tx.receive_amount) || 0
  const pct =
    snap?.feePercent != null && Number.isFinite(Number(snap.feePercent)) ? Number(snap.feePercent) : null
  if (pct != null && pct > 0 && productPrice > 0) return roundMoney((productPrice * pct) / 100)
  const rate = Number(tx.exchange_rate) || 0
  const hubSend = Number(tx.hub_fee_amount) || 0
  if (rate > 0 && hubSend > 0) return roundMoney(hubSend * rate)
  return 0
}

function LegacyOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t, i18n } = useTranslation("app")
  const locale = i18n.resolvedLanguage || i18n.language || "en"
  const navigation = useNavigation()
  const router = useRouter()
  const { showError } = useToast()
  const { currencies } = useFx()
  const flagFor = (code?: string | null) => currencies.find((c) => c.code === code)?.flag_svg
  const { data: tx, loading, refreshing, error, revalidate } = useTransaction(id)
  const retriedRef = useRef(false)
  const [retryDone, setRetryDone] = useState(false)

  useEffect(() => {
    if (!error || tx || retriedRef.current || !id) return
    retriedRef.current = true
    void revalidate().finally(() => setRetryDone(true))
  }, [error, tx, id, revalidate])

  const pending = (loading || refreshing) && !tx
  const missing = !pending && !tx && !error
  const loadFailed = !pending && !tx && Boolean(error) && retryDone
  const [copied, setCopied] = useState(false)
  const [payBusy, setPayBusy] = useState(false)
  const [receiptBusy, setReceiptBusy] = useState(false)

  useFocusRevalidate(revalidate)
  useRevalidateOnForeground(revalidate)

  const referral = tx ? isReferralPayout(tx) : false
  const isHub = tx ? isHubTransaction(tx) : false
  const tone = statusTone(tx?.status)

  // No title — the transaction status/amount is already the big heading in the body; a repeated header title is redundant.
  useEffect(() => {
    navigation.setOptions({ title: "" })
  }, [navigation])

  if (pending) {
    return (
      <ScreenScroll edges={["left", "right"]}>
        <StatusBar style="dark" />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenScroll>
    )
  }

  if (loadFailed) {
    return (
      <ScreenScroll edges={["left", "right"]}>
        <StatusBar style="dark" />
        <EmptyState
          title={t("txDetail.loadFailed", { defaultValue: "Couldn't load this transfer" })}
          body={t("txDetail.loadFailedHint", { defaultValue: "Check your connection and try again." })}
          actionLabel={t("common.retry", { defaultValue: "Retry" })}
          onAction={() => {
            setRetryDone(false)
            retriedRef.current = false
            void revalidate().finally(() => setRetryDone(true))
          }}
        />
      </ScreenScroll>
    )
  }

  if (missing || !tx) {
    return (
      <ScreenScroll edges={["left", "right"]}>
        <StatusBar style="dark" />
        <EmptyState title={t("txDetail.notFound", { defaultValue: "Transaction not found" })} />
      </ScreenScroll>
    )
  }

  const snap = (tx.hub_snapshot as HubSnapshot | null) || undefined
  const headlineAmount = isHub ? tx.total_amount : tx.send_amount
  const showTimeline = tone === "pending" || tone === "processing" || tone === "completed"
  const showTxId = showTimeline
  const createdMs = tx.created_at ? new Date(tx.created_at).getTime() : 0
  const overdue =
    (tone === "pending" || tone === "processing") && createdMs > 0 && Date.now() - createdMs > 3600_000
  const canPayNow = tx.payment_provider === "yookassa" && tone === "pending"
  const showBitbankerPay = tx.payment_provider === "bitbanker" && tone === "pending" && !isHub && !referral

  const statusMessage = (() => {
    const key = (suffix: string) => `txDetail.${suffix}`
    if (referral) {
      if (tone === "failed") return { title: t(key("payoutFailed")), description: t(key("payoutFailedDesc")) }
      if (tone === "cancelled")
        return { title: t(key("payoutCancelled")), description: t(key("payoutCancelledDesc")) }
      return { title: t(key("payoutProcessingGeneric")), description: t(key("payoutProcessingGenericDesc")) }
    }
    if (isHub) {
      if (tone === "failed")
        return { title: t(key("statusTxnFailed")), description: t(key("statusTxnFailedDesc")) }
      if (tone === "cancelled")
        return { title: t(key("statusTxnCancelled")), description: t(key("statusTxnCancelledDesc")) }
      return {
        title: t(key("hubStatusFulfillmentStarted")),
        description: t(key("hubStatusFulfillmentStartedDesc")),
      }
    }
    if (tone === "failed")
      return { title: t(key("statusTxnFailed")), description: t(key("statusTxnFailedDesc")) }
    if (tone === "cancelled")
      return { title: t(key("statusTxnCancelled")), description: t(key("statusTxnCancelledDesc")) }
    return { title: t(key("statusProcessing")), description: t(key("statusProcessingDesc")) }
  })()

  const copyTxId = () => {
    void Clipboard.setStringAsync(tx.transaction_id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const payNow = async () => {
    setPayBusy(true)
    try {
      await openInAppBrowser(apiUrl(`/pay/${tx.transaction_id.toLowerCase()}`))
      await revalidate()
    } finally {
      setPayBusy(false)
    }
  }

  const viewReceipt = async () => {
    if (!tx.receipt_url) return
    setReceiptBusy(true)
    try {
      const res = await fetchWithAuth(`/api/receipts/documents?path=${encodeURIComponent(tx.receipt_url)}`)
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
      if (!res.ok || !body.url) {
        showError(
          body.error || t("errors.generic", { defaultValue: "Something went wrong. Please try again." }),
        )
        return
      }
      await openInAppBrowser(body.url)
    } finally {
      setReceiptBusy(false)
    }
  }

  const items = Array.isArray(snap?.items) ? snap!.items! : null
  const receiveCur = String(snap?.fundedCurrency || tx.receive_currency || "") || "—"
  const sendCur = tx.send_currency || "—"
  const productPrice =
    snap?.fundedAmount != null && Number.isFinite(Number(snap.fundedAmount))
      ? Number(snap.fundedAmount)
      : Number(tx.receive_amount) || 0
  const hubFeeRecv = hubFeeReceiveAmount(tx, snap)
  const subtotalRecv = roundMoney(productPrice + hubFeeRecv)
  const feeAmount = Number(tx.fee_amount) || 0
  const rate = Number(tx.exchange_rate)

  const contactName = String(snap?.contactName || "").trim()
  const contactPhone = String(snap?.contactPhone || "").trim()
  const addressLine = String(snap?.deliveryAddressLine || "").trim()
  const inPerson = snap?.fulfillmentType === "in_person"
  const commentText =
    typeof snap?.formAnswers?.comment === "string" ? String(snap.formAnswers.comment).trim() : ""

  return (
    <ScreenScroll edges={["left", "right"]}>
      <StatusBar style="dark" />

      <Text style={styles.eyebrow}>
        {referral ? t("txDetail.payoutStatus") : t("txDetail.transactionStatus")}
      </Text>
      <Text style={styles.amount}>{formatMoney(headlineAmount, sendCur)}</Text>

      {showTxId ? (
        <View style={styles.txIdRow}>
          <Text style={styles.txIdLabel}>{t("txDetail.transactionId")}</Text>
          <Pressable onPress={copyTxId} style={styles.txIdValue} hitSlop={8}>
            <Text style={styles.txIdText}>{tx.transaction_id}</Text>
            {copied ? (
              <Check size={14} color={colors.success} strokeWidth={2.4} />
            ) : (
              <Copy size={14} color={colors.muted} strokeWidth={2} />
            )}
          </Pressable>
        </View>
      ) : null}

      <View style={styles.card}>
        {showTimeline ? (
          <TransactionTimeline transaction={tx} locale={locale} />
        ) : (
          <View style={styles.failureBlock}>
            <View style={[styles.failureIcon, tone === "cancelled" && styles.failureIconCancelled]}>
              <XCircle size={28} color={tone === "cancelled" ? "#4B5563" : "#DC2626"} strokeWidth={2} />
            </View>
            <Text style={styles.failureTitle}>{statusMessage.title}</Text>
            <Text style={styles.failureDesc}>{statusMessage.description}</Text>
            <View style={styles.failureMeta}>
              <Text style={styles.failureMetaText}>
                {t("txDetail.createdLabel")} {formatDateTimeLine(tx.created_at, locale)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {tx.receipt_url ? (
        <Pressable onPress={() => void viewReceipt()} disabled={receiptBusy} style={styles.receiptCard}>
          <View style={styles.receiptIcon}>
            {receiptBusy ? (
              <ActivityIndicator size="small" color={colors.success} />
            ) : (
              <FileCheck size={18} color={colors.success} />
            )}
          </View>
          <View style={styles.receiptBody}>
            <Text style={styles.receiptTitle}>{t("txDetail.receiptUploaded")}</Text>
            <Text style={styles.receiptSub}>{tx.receipt_filename || t("txDetail.receiptFile")}</Text>
          </View>
        </Pressable>
      ) : null}

      {canPayNow ? (
        <View style={styles.payNowWrap}>
          <PrimaryButton
            label={t("hub.checkout.paidOnline", { defaultValue: "Complete payment" })}
            busy={payBusy}
            onPress={() => void payNow()}
          />
        </View>
      ) : null}

      {showBitbankerPay ? (
        <MobileBitbankerPayCard transactionId={tx.transaction_id} totalRub={Number(tx.total_amount || 0)} />
      ) : null}

      <View style={styles.actions}>
        {!referral && !isHub ? (
          <View style={styles.actionHalf}>
            <PrimaryButton
              label={t("txDetail.sendAgain")}
              variant="secondary"
              onPress={() => router.push("/send" as never)}
            />
          </View>
        ) : null}
        {isHub ? (
          <View style={styles.actionHalf}>
            <PrimaryButton
              label={t("hub.backToHub")}
              variant="secondary"
              onPress={() => router.replace("/(app)/hub" as never)}
            />
          </View>
        ) : null}
        {referral ? (
          <View style={styles.actionHalf}>
            <PrimaryButton
              label={t("txDetail.backToReferrals")}
              variant="secondary"
              onPress={() => router.push("/referrals" as never)}
            />
          </View>
        ) : null}
        <View style={styles.actionHalf}>
          {overdue ? (
            <PrimaryButton
              label={t("txDetail.contactSupport")}
              onPress={() => router.push("/support" as never)}
            />
          ) : (
            <PrimaryButton
              label={t("txDetail.dashboard")}
              onPress={() => router.replace("/(app)/hub" as never)}
            />
          )}
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryHeading}>
          {referral
            ? t("txDetail.payoutSummary")
            : isHub
              ? t("hub.checkout.orderSummary", { defaultValue: "Order summary" })
              : t("txDetail.transactionSummary")}
        </Text>

        {isHub ? (
          <>
            <SummaryRow
              label={
                items
                  ? t("hub.checkout.orderLabel", { defaultValue: "Order" })
                  : t("hub.checkout.productLabel")
              }
              value={typeof snap?.productTitle === "string" ? snap.productTitle : "—"}
              bold
            />
            {items ? (
              <View style={styles.itemsBox}>
                {items.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemText} numberOfLines={1}>
                      {item.quantity} × {item.title}
                    </Text>
                    <Text style={styles.itemAmount}>{formatMoney(item.lineTotal, receiveCur)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <SummaryRow
              label={t("hub.checkout.productPrice")}
              value={formatMoney(productPrice, receiveCur)}
            />
            <SummaryRow
              label={t("hub.checkout.hubFee")}
              value={hubFeeRecv === 0 ? t("send.free") : formatMoney(hubFeeRecv, receiveCur)}
              tone={hubFeeRecv === 0 ? "success" : undefined}
            />
            <SummaryRow
              label={t("send.fee")}
              value={feeAmount === 0 ? t("send.free") : formatMoney(feeAmount, sendCur)}
              tone={feeAmount === 0 ? "success" : undefined}
            />
            <SummaryRow label={t("hub.checkout.subtotal")} value={formatMoney(subtotalRecv, receiveCur)} />
            <SummaryRow
              label={t("hub.checkout.exchangeRate", { defaultValue: "Exchange Rate" })}
              value={
                Number.isFinite(rate) && rate > 0 ? `1 ${sendCur} = ${rate.toFixed(2)} ${receiveCur}` : "—"
              }
            />
            <SummaryRow
              label={t("txDetail.hubTotalToPaid", { defaultValue: "Total to paid" })}
              value={formatMoney(tx.total_amount, sendCur)}
              bold
              border
            />
            {tx.payment_provider === "yookassa" ? (
              <SummaryRow
                label={t("hub.checkout.paymentMethod", { defaultValue: "Payment method" })}
                value={t("hub.checkout.paidOnline", { defaultValue: "Paid online" })}
              />
            ) : null}
          </>
        ) : (
          <>
            <SummaryRow
              label={referral ? t("txDetail.withdrawalAmount") : t("txDetail.youSent")}
              value={formatMoney(tx.send_amount, sendCur)}
              bold
            />
            <SummaryRow
              label={t("txDetail.fee")}
              value={feeAmount === 0 ? t("txDetail.free") : formatMoney(feeAmount, sendCur)}
              tone={feeAmount === 0 ? "success" : undefined}
            />
            <SummaryRow
              label={t("txDetail.recipientGets")}
              value={formatMoney(tx.receive_amount, tx.receive_currency)}
              bold
            />
            <SummaryRow
              label={t("txDetail.exchangeRate")}
              value={
                Number.isFinite(rate) && rate > 0
                  ? `1 ${sendCur} = ${rate.toFixed(2)} ${tx.receive_currency}`
                  : "—"
              }
            />
            {tx.fulfillment_type === "cash_hand" ? (
              <SummaryRow
                label={t("txDetail.logisticsFee")}
                value={
                  (tx.logistics_fee_amount ?? 0) === 0
                    ? t("txDetail.free")
                    : formatMoney(tx.logistics_fee_amount ?? 0, sendCur)
                }
                tone={(tx.logistics_fee_amount ?? 0) === 0 ? "success" : undefined}
              />
            ) : null}
            <SummaryRow
              label={t("txDetail.totalPaid")}
              value={formatMoney(tx.total_amount, sendCur)}
              bold
              border
            />
            {tx.payment_provider === "bitbanker" ? (
              <SummaryRow label="Payment" value="SBP (Bitbanker)" />
            ) : null}
          </>
        )}

        {isHub ? (
          <View style={styles.fulfillmentBox}>
            <View style={styles.fulfillmentHead}>
              <Package2 size={16} color={colors.muted} />
              <Text style={styles.fulfillmentTitle}>{t("hub.checkout.fulfillmentSummary")}</Text>
            </View>
            {contactName ? (
              <View style={styles.fulfillmentRow}>
                <UserRound size={14} color={colors.muted} />
                <Text style={styles.fulfillmentText}>{contactName}</Text>
              </View>
            ) : null}
            {contactPhone ? (
              <View style={styles.fulfillmentRow}>
                <Phone size={14} color={colors.muted} />
                <Text style={styles.fulfillmentText}>{contactPhone}</Text>
              </View>
            ) : null}
            {inPerson && addressLine ? (
              <View style={styles.fulfillmentRow}>
                <MapPin size={14} color={colors.muted} />
                <Text style={styles.fulfillmentText}>{addressLine}</Text>
              </View>
            ) : null}
            {commentText ? (
              <View style={styles.fulfillmentRow}>
                <Package2 size={14} color={colors.muted} />
                <Text style={styles.fulfillmentText}>{commentText}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <>
            {tx.fulfillment_type === "cash_hand" && (tx.delivery_address_line || tx.delivery_phone) ? (
              <View style={styles.recipientBlock}>
                <Text style={styles.recipientHeading}>{t("txDetail.cashDelivery")}</Text>
                {tx.delivery_address_line ? (
                  <Text style={styles.recipientText}>{tx.delivery_address_line}</Text>
                ) : null}
                {tx.delivery_phone ? <Text style={styles.recipientMeta}>{tx.delivery_phone}</Text> : null}
              </View>
            ) : null}
            {tx.recipient ? (
              <View style={styles.recipientBlock}>
                <Text style={styles.recipientHeading}>{t("txDetail.recipient")}</Text>
                <View style={styles.recipientCard}>
                  <View style={styles.recipientAvatarWrap}>
                    <Avatar name={tx.recipient.full_name || "?"} size={48} />
                    {flagFor(tx.receive_currency) ? (
                      <View style={styles.recipientFlagBadge}>
                        <SvgXml xml={flagFor(tx.receive_currency)!} width={18} height={12} />
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.recipientCardBody}>
                    <Text style={styles.recipientName} numberOfLines={1}>
                      {tx.recipient.full_name}
                    </Text>
                    {tx.recipient.bank_name ? (
                      <Text style={styles.recipientMeta} numberOfLines={1}>
                        {tx.recipient.bank_name}
                      </Text>
                    ) : null}
                    {tx.recipient.account_number ? (
                      <Text style={styles.recipientAccount} numberOfLines={1}>
                        {tx.recipient.account_number}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
            ) : null}
          </>
        )}
      </View>
    </ScreenScroll>
  )
}

function SummaryRow({
  label,
  value,
  bold,
  border,
  tone,
}: {
  label: string
  value: string
  bold?: boolean
  border?: boolean
  tone?: "success"
}) {
  return (
    <View style={[styles.summaryRow, border && styles.summaryRowBorder]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text
        style={[
          styles.summaryValue,
          bold && styles.summaryValueBold,
          tone === "success" && styles.summaryValueSuccess,
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  )
}

function MobileBitbankerPayCard({ transactionId, totalRub }: { transactionId: string; totalRub: number }) {
  const [payment, setPayment] = useState<{
    qrData: string | null
    link: string | null
    amount: number | null
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const res = await fetchWithAuth(
        `/api/send/transfers/${encodeURIComponent(transactionId)}/payment-status`,
      )
      if (!res.ok || cancelled) return
      const body = (await res.json()) as {
        payment?: { qrData?: string | null; link?: string | null; amount?: number | null }
      }
      if (body.payment) {
        setPayment({
          qrData: body.payment.qrData ?? null,
          link: body.payment.link ?? null,
          amount: body.payment.amount ?? null,
        })
      }
    }
    void load()
    const id = setInterval(() => void load(), 8000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [transactionId])

  const amount = payment?.amount ?? totalRub

  return (
    <View style={styles.bitbankerCard}>
      <Text style={styles.bitbankerTitle}>Pay with SBP</Text>
      <Text style={styles.bitbankerAmount}>{formatMoney(amount, "RUB")}</Text>
      {payment?.qrData ? <Image source={{ uri: payment.qrData }} style={styles.bitbankerQr} /> : null}
      {payment?.link ? (
        <Pressable onPress={() => void Linking.openURL(payment.link!)} style={styles.bitbankerLink}>
          <Text style={styles.bitbankerLinkText}>Open payment link</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  center: { paddingVertical: 80, alignItems: "center" },
  eyebrow: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    textAlign: "center",
  },
  amount: { marginTop: 6, fontSize: 32, fontWeight: "700", color: colors.text, textAlign: "center" },
  txIdRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  txIdLabel: { fontSize: typeSize.meta, color: colors.muted },
  txIdValue: { flexDirection: "row", alignItems: "center", gap: 6 },
  txIdText: { fontSize: typeSize.meta, fontFamily: "Courier", color: colors.text },
  card: { marginTop: 16 },
  failureBlock: { alignItems: "center", paddingVertical: 8 },
  failureIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    marginBottom: 12,
  },
  failureIconCancelled: { backgroundColor: "#F3F4F6" },
  failureTitle: { fontSize: 17, fontWeight: "700", color: colors.text, textAlign: "center" },
  failureDesc: { marginTop: 6, fontSize: typeSize.body, color: colors.muted, textAlign: "center" },
  failureMeta: { marginTop: 14 },
  failureMetaText: { fontSize: typeSize.meta, color: colors.muted },
  receiptCard: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.row,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  receiptIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
  },
  receiptBody: { flex: 1 },
  receiptTitle: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  receiptSub: { marginTop: 2, fontSize: 12, color: colors.muted },
  payNowWrap: { marginTop: 16 },
  bitbankerCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    alignItems: "center",
  },
  bitbankerTitle: { fontSize: typeSize.body, fontWeight: "700", color: colors.text },
  bitbankerAmount: { marginTop: 8, fontSize: 22, fontWeight: "700", color: colors.text },
  bitbankerQr: { marginTop: 12, width: 220, height: 220, borderRadius: 8 },
  bitbankerLink: { marginTop: 12 },
  bitbankerLinkText: { color: colors.primaryDeep, fontWeight: "600" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 16 },
  actionHalf: { flexGrow: 1, flexBasis: "45%" },
  summaryCard: {
    marginTop: 24,
    marginBottom: 24,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
  },
  summaryHeading: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 },
  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 6,
  },
  summaryRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: 4,
    paddingTop: 10,
  },
  summaryLabel: { flexShrink: 1, fontSize: typeSize.meta, color: colors.muted },
  summaryValue: {
    flexShrink: 1,
    textAlign: "right",
    fontSize: typeSize.meta,
    fontWeight: "600",
    color: colors.text,
  },
  summaryValueBold: { fontSize: typeSize.body, fontWeight: "700" },
  summaryValueSuccess: { color: colors.success },
  itemsBox: {
    backgroundColor: colors.paper,
    borderRadius: radius.row,
    padding: 10,
    marginVertical: 6,
    gap: 6,
  },
  itemRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  itemText: { flex: 1, fontSize: 13, color: colors.muted },
  itemAmount: { fontSize: 13, fontWeight: "600", color: colors.text },
  fulfillmentBox: {
    marginTop: 14,
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    padding: 14,
    gap: 8,
  },
  fulfillmentHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  fulfillmentTitle: { fontSize: typeSize.meta, fontWeight: "700", color: colors.text },
  fulfillmentRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  fulfillmentText: { flex: 1, fontSize: typeSize.meta, color: "#374151" },
  recipientBlock: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  recipientHeading: { fontSize: typeSize.meta, fontWeight: "700", color: colors.text, marginBottom: 6 },
  recipientText: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  recipientMeta: { fontSize: typeSize.meta, color: colors.muted, marginTop: 2 },
  recipientCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    padding: 12,
  },
  recipientAvatarWrap: { position: "relative" },
  recipientFlagBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    borderRadius: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.paper,
  },
  recipientCardBody: { flex: 1, minWidth: 0 },
  recipientName: { fontSize: typeSize.body, fontWeight: "700", color: colors.text },
  recipientAccount: { fontSize: 12, fontFamily: "Courier", color: colors.muted },
})

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    [order, setOrder] = useState<MarketplaceOrder | null>(null),
    [legacy, setLegacy] = useState(false),
    [failed, setFailed] = useState(false),
    { t } = useTranslation("app")
  useEffect(() => {
    void fetchWithAuth(`/api/hub/orders/${id}`)
      .then(async (r) => {
        if (r.status === 404) {
          setLegacy(true)
          return
        }
        if (!r.ok) throw Error()
        setOrder((await r.json()).order)
      })
      .catch(() => setFailed(true))
  }, [id])
  return order ? (
    <MarketplaceOrderView order={order} onChange={setOrder} />
  ) : legacy ? (
    <LegacyOrderScreen />
  ) : (
    <ScreenScroll>
      <Text>{t(failed ? "marketplace.retryError" : "marketplace.loading")}</Text>
    </ScreenScroll>
  )
}
