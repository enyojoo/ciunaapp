import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { AppTextInput } from "@/components/app-text-input"
import { useInputFocusRing } from "@/lib/focused-input-box"
import { useTranslation } from "react-i18next"
import {
  clampSendAmountForCurrency,
  currenciesForReceivePicker,
  currenciesForSendPicker,
  defaultSendAmountForCurrency,
  formatExchangeRateDisplay,
  minSendAmountForCurrency,
} from "@ciuna/shared"
import { CurrencyFlag } from "@/components/currency-flag"
import { InlineSkeleton } from "@/components/inline-skeleton"
import { SendQuoteNotice } from "@/components/send/send-quote-notice"
import { SheetPicker } from "@/components/sheet-picker"
import type { SendQuotePreviewNotice } from "@/lib/bitbanker-quote-notice"
import { formatMoney, getCurrencyNarrowSymbol, roundMoney } from "@/lib/money"
import { findRate, quoteSend, type RateRow } from "@/lib/fx"
import type { BitbankerQuotePreview } from "@/lib/use-bitbanker-quote-preview"
import type { CurrencyRow } from "@/lib/types"
import { colors, radius, type as typeSize } from "@/lib/theme"

export const SEND_DEFAULT_AMOUNT = "10"

function sanitizeAmountInput(raw: string): string {
  const normalized = raw.replace(/,/g, ".")
  let out = ""
  let dot = false
  for (const ch of normalized) {
    if (ch >= "0" && ch <= "9") out += ch
    else if (ch === "." && !dot) {
      dot = true
      out += ch
    }
  }
  return out
}

function CurrencyPickerButton({
  code,
  currencies,
  onPress,
  label,
  pickerEnabled,
}: {
  code: string
  currencies: CurrencyRow[]
  onPress: () => void
  label: string
  pickerEnabled: boolean
}) {
  const row = currencies.find((c) => c.code === code)
  const inner = (
    <>
      <CurrencyFlag code={code} flagSvg={row?.flag_svg} size={20} />
      <Text style={styles.currencyCode}>{code}</Text>
      {pickerEnabled ? <Text style={styles.currencyCaret}>▾</Text> : null}
    </>
  )
  if (!pickerEnabled) {
    return (
      <View style={styles.currencyBtn} accessibilityLabel={label}>
        {inner}
      </View>
    )
  }
  return (
    <Pressable
      onPress={onPress}
      style={styles.currencyBtn}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {inner}
    </Pressable>
  )
}

export function SendAmountStep({
  sendAmount,
  onChangeAmount,
  sendCurrency,
  receiveCurrency,
  onChangeSendCurrency,
  onChangeReceiveCurrency,
  currencies,
  rates,
  usesBitbanker,
  bitbankerPreview,
  quoteNotice,
  quotePreviewLoading,
  bitbankerFeesConfirmed,
  ratesLoading,
}: {
  sendAmount: string
  onChangeAmount: (v: string) => void
  sendCurrency: string
  receiveCurrency: string
  onChangeSendCurrency: (code: string) => void
  onChangeReceiveCurrency: (code: string) => void
  currencies: CurrencyRow[]
  rates: RateRow[]
  usesBitbanker?: boolean
  bitbankerPreview?: BitbankerQuotePreview | null
  quoteNotice?: SendQuotePreviewNotice | null
  quotePreviewLoading?: boolean
  /** From useBitbankerQuotePreview — do not re-derive (desk hint is not a failure). */
  bitbankerFeesConfirmed?: boolean
  /** Office FX still loading — suppress false "rate unavailable" warnings. */
  ratesLoading?: boolean
}) {
  const { t } = useTranslation("app")
  const [openSend, setOpenSend] = useState(false)
  const [openRecv, setOpenRecv] = useState(false)
  const sendAmountFocus = useInputFocusRing()
  const sendable = useMemo(
    () => currenciesForSendPicker(currencies, receiveCurrency),
    [currencies, receiveCurrency],
  )
  const receivable = useMemo(
    () => currenciesForReceivePicker(currencies, sendCurrency),
    [currencies, sendCurrency],
  )
  const sendPickerEnabled = sendable.length > 1
  const receivePickerEnabled = receivable.length > 1

  const rate = findRate(rates, sendCurrency, receiveCurrency)
  const amtNum = Number(sendAmount)
  const hasSendAmount = Number.isFinite(amtNum) && amtNum > 0
  const quoteAmount = hasSendAmount ? amtNum : 0
  const minSend = minSendAmountForCurrency(sendCurrency)
  const belowMin = minSend != null && hasSendAmount && amtNum > 0 && amtNum < minSend
  const showBelowMinNotice =
    belowMin && !ratesLoading && !(usesBitbanker && quotePreviewLoading)
  const fxQuote = quoteSend(quoteAmount, rate)
  const corridorFee = fxQuote?.feeAmount ?? 0
  const processingFeeAmount =
    usesBitbanker && bitbankerPreview
      ? roundMoney(bitbankerPreview.feeAmount + bitbankerPreview.paymentProcessingFee)
      : corridorFee
  const receiveAmount =
    bitbankerPreview?.receiveAmount ?? fxQuote?.receiveAmount ?? 0
  const displayRate = bitbankerPreview?.exchangeRate ?? fxQuote?.rate ?? 0
  const totalToPay =
    usesBitbanker && bitbankerPreview
      ? bitbankerPreview.totalAmount
      : fxQuote?.totalAmount ?? roundMoney(quoteAmount + corridorFee)
  const rateReady = Boolean(rate && displayRate > 0)
  const feesConfirmed = usesBitbanker ? Boolean(bitbankerFeesConfirmed) : true
  const bitbankerFeesIndeterminate = Boolean(
    usesBitbanker && !quoteNotice && (belowMin || !feesConfirmed),
  )
  const showProcessingFeeSkeleton = bitbankerFeesIndeterminate
  const processingFeeDisplay = (() => {
    if (showProcessingFeeSkeleton) return ""
    if (!usesBitbanker) {
      if (!rateReady) return t("send.free")
      if (processingFeeAmount > 0) return formatMoney(processingFeeAmount, sendCurrency)
      return t("send.free")
    }
    if (!feesConfirmed) return ""
    if (processingFeeAmount > 0) return formatMoney(processingFeeAmount, sendCurrency)
    return t("send.free")
  })()
  const amountPlaceholder = defaultSendAmountForCurrency(sendCurrency)
  const sendSymbol = getCurrencyNarrowSymbol(sendCurrency)
  const recvSymbol = getCurrencyNarrowSymbol(receiveCurrency)
  const receiveDigits = roundMoney(receiveAmount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const commitAmount = (raw: string) => {
    const cleaned = sanitizeAmountInput(raw)
    if (!cleaned || cleaned === ".") {
      onChangeAmount(defaultSendAmountForCurrency(sendCurrency))
      return
    }
    const n = Number(cleaned)
    if (Number.isFinite(n)) {
      onChangeAmount(String(clampSendAmountForCurrency(n, sendCurrency)))
      return
    }
    onChangeAmount(cleaned)
  }

  return (
    <View style={styles.root}>
      <View style={styles.exchangeCard}>
        <View style={styles.lane}>
          <Text style={styles.laneLabel}>{t("send.youSend")}</Text>
          <View style={styles.laneRow}>
            <CurrencyPickerButton
              code={sendCurrency}
              currencies={currencies}
              onPress={() => setOpenSend(true)}
              label={t("send.youSend")}
              pickerEnabled={sendPickerEnabled}
            />
            <View style={[styles.amountField, sendAmountFocus.boxStyle]}>
              <Text style={styles.amountSymbol}>{sendSymbol}</Text>
              <AppTextInput
                value={sendAmount}
                onChangeText={(v) => onChangeAmount(sanitizeAmountInput(v))}
                onFocus={sendAmountFocus.onFocus}
                onBlur={() => {
                  sendAmountFocus.onBlur()
                  commitAmount(sendAmount)
                }}
                keyboardType="decimal-pad"
                placeholder={amountPlaceholder}
                placeholderTextColor="#9CA3AF"
                style={styles.amountInput}
                maxLength={14}
              />
            </View>
          </View>
        </View>

        <View style={styles.laneDivider} />

        <View style={styles.lane}>
          <Text style={styles.laneLabel}>{t("send.receiverGets")}</Text>
          <View style={styles.laneRow}>
            <CurrencyPickerButton
              code={receiveCurrency}
              currencies={currencies}
              onPress={() => setOpenRecv(true)}
              label={t("send.receiverGets")}
              pickerEnabled={receivePickerEnabled}
            />
            <View style={[styles.amountField, styles.amountFieldReadonly]}>
              <Text style={styles.amountSymbol}>{recvSymbol}</Text>
              <Text style={styles.receiveAmount} numberOfLines={1}>
                {receiveDigits}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.quote}>
        {rateReady ? (
          <View style={styles.quoteRow}>
            <Text style={styles.quoteLabel}>{t("send.rate")}</Text>
            <Text style={styles.quoteValue}>
              {`1 ${sendCurrency} = ${formatExchangeRateDisplay(displayRate)} ${receiveCurrency}`}
            </Text>
          </View>
        ) : null}
        <View style={styles.quoteRow}>
          <Text style={styles.quoteLabel}>{t("send.processingFee", { defaultValue: "Processing Fee" })}</Text>
          {showProcessingFeeSkeleton ? (
            <View style={styles.feeSkeletonSlot}>
              <InlineSkeleton width={92} height={16} />
            </View>
          ) : (
            <Text style={styles.quoteValue}>{processingFeeDisplay}</Text>
          )}
        </View>
        <View style={styles.quoteRow}>
          <Text style={styles.quoteLabel}>{t("send.receiverGets")}</Text>
          <Text style={styles.quoteValueStrong}>
            {rateReady ? formatMoney(receiveAmount, receiveCurrency) : formatMoney(0, receiveCurrency)}
          </Text>
        </View>
        <View style={[styles.quoteRow, styles.quoteTotalRow]}>
          <Text style={styles.totalLabel}>{t("send.totalToPay")}</Text>
          {showProcessingFeeSkeleton ? (
            <View style={styles.feeSkeletonSlot}>
              <InlineSkeleton width={100} height={18} />
            </View>
          ) : (
            <Text style={styles.totalValue}>{formatMoney(totalToPay, sendCurrency)}</Text>
          )}
        </View>
        {showBelowMinNotice ? (
          <SendQuoteNotice notice={{ kind: "warning", messageKey: "send.mobile.quoteBelowMinRub" }} />
        ) : null}
        {!ratesLoading && !rateReady && sendCurrency && receiveCurrency ? (
          <SendQuoteNotice
            notice={{ kind: "warning", messageKey: "send.rateUnavailable" }}
          />
        ) : null}
        {quoteNotice && !quotePreviewLoading ? <SendQuoteNotice notice={quoteNotice} /> : null}
      </View>

      {sendPickerEnabled ? (
        <SheetPicker
          open={openSend}
          title={t("send.youSend")}
          items={sendable}
          keyExtractor={(c) => c.code}
          labelExtractor={(c) => `${c.code}${c.name ? ` · ${c.name}` : ""}`}
          leadingExtractor={(c) => <CurrencyFlag code={c.code} flagSvg={c.flag_svg} size={20} />}
          selectedId={sendCurrency}
          onSelect={(c) => onChangeSendCurrency(c.code)}
          onClose={() => setOpenSend(false)}
        />
      ) : null}
      {receivePickerEnabled ? (
        <SheetPicker
          open={openRecv}
          title={t("send.receiverGets")}
          items={receivable}
          keyExtractor={(c) => c.code}
          labelExtractor={(c) => `${c.code}${c.name ? ` · ${c.name}` : ""}`}
          leadingExtractor={(c) => <CurrencyFlag code={c.code} flagSvg={c.flag_svg} size={20} />}
          selectedId={receiveCurrency}
          onSelect={(c) => onChangeReceiveCurrency(c.code)}
          onClose={() => setOpenRecv(false)}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { gap: 14 },
  exchangeCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  lane: { paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  laneLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.muted,
  },
  laneRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  currencyBtn: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.row,
    backgroundColor: colors.paper,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  currencyCode: { fontSize: typeSize.meta, fontWeight: "700", color: colors.text },
  currencyCaret: { fontSize: 10, color: colors.muted, marginTop: 1 },
  amountField: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FAFAFA",
  },
  amountFieldReadonly: { backgroundColor: colors.paper },
  amountSymbol: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.muted,
    lineHeight: 32,
  },
  amountInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    paddingVertical: 0,
    letterSpacing: -0.5,
  },
  receiveAmount: {
    flex: 1,
    minWidth: 0,
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.5,
  },
  laneDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: 14,
  },
  quote: {
    gap: 10,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  quoteRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  quoteLabel: { fontSize: typeSize.meta, color: colors.muted },
  quoteValue: { fontSize: typeSize.meta, fontWeight: "600", color: colors.text, textAlign: "right", flex: 1 },
  feeSkeletonSlot: { flex: 1, alignItems: "flex-end", justifyContent: "center" },
  quoteValueStrong: { fontSize: typeSize.body, fontWeight: "700", color: colors.text, textAlign: "right", flex: 1 },
  quoteTotalRow: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  totalLabel: { fontSize: typeSize.body, fontWeight: "700", color: colors.text },
  totalValue: { fontSize: typeSize.body, fontWeight: "700", color: colors.primary },
})
