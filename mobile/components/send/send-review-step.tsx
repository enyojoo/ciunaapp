import { Image, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { formatExchangeRateDisplay } from "@ciuna/shared"
import { CurrencyFlag } from "@/components/currency-flag"
import { InlineSkeleton } from "@/components/inline-skeleton"
import { formatMoney } from "@/lib/money"
import type { CurrencyRow, RecipientRow } from "@/lib/types"
import type { Quote } from "@/lib/fx"
import { colors, radius, type as typeSize } from "@/lib/theme"

export function SendReviewStep({
  sendAmount,
  sendCurrency,
  receiveCurrency,
  quote,
  processingFeeAmount,
  recipient,
  currencies,
  usesBitbanker,
  processingFeePending,
  qrData,
}: {
  sendAmount: string
  sendCurrency: string
  receiveCurrency: string
  quote: Quote
  processingFeeAmount: number
  recipient: RecipientRow | undefined
  currencies: CurrencyRow[]
  usesBitbanker: boolean
  processingFeePending?: boolean
  qrData?: string | null
}) {
  const { t } = useTranslation("app")
  const sendRow = currencies.find((c) => c.code === sendCurrency)
  const recvRow = currencies.find((c) => c.code === receiveCurrency)

  return (
    <View style={styles.root}>
      <Text style={styles.headline}>{t("send.mobile.reviewHeadline", { defaultValue: "Review & pay" })}</Text>

      <View style={styles.summary}>
        <Text style={styles.sectionTitle}>{t("send.transactionSummary")}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>{t("send.youSendLabel")}</Text>
          <View style={styles.valueRow}>
            <CurrencyFlag code={sendCurrency} flagSvg={sendRow?.flag_svg} size={20} />
            <Text style={styles.value}>{formatMoney(Number(sendAmount), sendCurrency)}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{t("send.recipientGetsLabel")}</Text>
          <View style={styles.valueRow}>
            <CurrencyFlag code={receiveCurrency} flagSvg={recvRow?.flag_svg} size={20} />
            <Text style={styles.valueStrong}>{formatMoney(quote.receiveAmount, receiveCurrency)}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{t("send.processingFee", { defaultValue: "Processing fee" })}</Text>
          {processingFeePending ? (
            <InlineSkeleton width={88} height={16} />
          ) : (
            <Text style={styles.value}>
              {processingFeeAmount > 0 ? formatMoney(processingFeeAmount, sendCurrency) : t("send.free")}
            </Text>
          )}
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{t("send.exchangeRateLabel")}</Text>
          <Text style={styles.value}>
            1 {sendCurrency} = {formatExchangeRateDisplay(quote.rate)} {receiveCurrency}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.totalLabel}>{t("send.totalToPay")}</Text>
          <Text style={styles.totalValue}>{formatMoney(quote.totalAmount, sendCurrency)}</Text>
        </View>

        {recipient ? (
          <>
            <View style={styles.divider} />
            <View style={styles.recipientBlock}>
              <Text style={styles.label}>{t("send.recipientLabel")}</Text>
              <Text style={styles.recipientName}>{recipient.full_name}</Text>
              {recipient.bank_name ? <Text style={styles.recipientMeta}>{recipient.bank_name}</Text> : null}
              {recipient.account_number ? <Text style={styles.recipientMeta}>{recipient.account_number}</Text> : null}
            </View>
          </>
        ) : null}

        {usesBitbanker ? (
          <View style={styles.sbpBadge}>
            <Text style={styles.sbpText}>{t("send.mobile.paymentSbp", { defaultValue: "Payment: SBP (Bitbanker)" })}</Text>
          </View>
        ) : null}
      </View>

      {qrData ? (
        <View style={styles.qrWrap}>
          <Image source={{ uri: qrData }} style={styles.qr} accessibilityLabel={t("send.qrCodeAlt")} />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { gap: 16 },
  headline: { fontSize: 22, fontWeight: "700", color: colors.text, letterSpacing: -0.3 },
  summary: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  sectionTitle: { fontSize: typeSize.meta, fontWeight: "700", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.6 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  label: { fontSize: typeSize.meta, color: colors.muted, flex: 1 },
  valueRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  value: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  valueStrong: { fontSize: typeSize.body, fontWeight: "700", color: colors.text },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 4 },
  totalLabel: { fontSize: typeSize.body, fontWeight: "700", color: colors.text },
  totalValue: { fontSize: 18, fontWeight: "700", color: colors.primary },
  recipientBlock: { gap: 4 },
  recipientName: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  recipientMeta: { fontSize: typeSize.meta, color: colors.muted },
  sbpBadge: {
    marginTop: 4,
    alignSelf: "flex-start",
    borderRadius: radius.row,
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sbpText: { fontSize: typeSize.meta, fontWeight: "600", color: colors.primary },
  qrWrap: { alignItems: "center", paddingVertical: 8 },
  qr: { width: 220, height: 220, borderRadius: radius.card },
})
