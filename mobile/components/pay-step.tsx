import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { CurrencyFlag } from "@/components/currency-flag"
import { Field } from "./field"
import { SheetPicker } from "./sheet-picker"
import {
  currenciesForReceivePicker,
  currenciesForSendPicker,
  formatExchangeRateDisplay,
} from "@ciuna/shared"
import { formatMoney } from "@/lib/money"
import { findRate, quoteSend, type RateRow } from "@/lib/fx"
import type { CurrencyRow } from "@/lib/types"
import { colors, radius, type as typeSize } from "@/lib/theme"

export function PayStep({
  sendAmount,
  onChangeAmount,
  sendCurrency,
  receiveCurrency,
  onChangeSendCurrency,
  onChangeReceiveCurrency,
  currencies,
  rates,
  amountLabel,
  amountEditable = true,
  showAmount = true,
  showQuote = true,
}: {
  sendAmount: string
  onChangeAmount?: (v: string) => void
  sendCurrency: string
  receiveCurrency: string
  onChangeSendCurrency: (code: string) => void
  onChangeReceiveCurrency: (code: string) => void
  currencies: CurrencyRow[]
  rates: RateRow[]
  amountLabel?: string
  amountEditable?: boolean
  showAmount?: boolean
  showQuote?: boolean
}) {
  const [openSend, setOpenSend] = useState(false)
  const [openRecv, setOpenRecv] = useState(false)
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
  const amt = Number(sendAmount)
  const rate = findRate(rates, sendCurrency, receiveCurrency)
  const quote = quoteSend(Number.isFinite(amt) ? amt : 0, rate)

  return (
    <View>
      {showAmount ? (
        <Field
          label={amountLabel || "You send"}
          value={sendAmount}
          onChangeText={onChangeAmount}
          keyboardType="decimal-pad"
          editable={amountEditable}
        />
      ) : null}
      <View style={styles.row}>
        {sendPickerEnabled ? (
          <Pressable style={styles.flex} onPress={() => setOpenSend(true)}>
            <View style={styles.passThrough}>
              <Field label="Pay in" value={sendCurrency} editable={false} />
            </View>
          </Pressable>
        ) : (
          <View style={styles.flex}>
            <Field label="Pay in" value={sendCurrency} editable={false} />
          </View>
        )}
        {receivePickerEnabled ? (
          <Pressable style={styles.flex} onPress={() => setOpenRecv(true)}>
            <View style={styles.passThrough}>
              <Field label="They get" value={receiveCurrency} editable={false} />
            </View>
          </Pressable>
        ) : (
          <View style={styles.flex}>
            <Field label="They get" value={receiveCurrency} editable={false} />
          </View>
        )}
      </View>
      {showQuote && quote ? (
        <View style={styles.quote}>
          <Text style={styles.meta}>
            Rate 1 {sendCurrency} = {formatExchangeRateDisplay(quote.rate)} {receiveCurrency}
          </Text>
          <Text style={styles.meta}>
            {quote.feeAmount > 0
              ? `Exchange fee ${formatMoney(quote.feeAmount, sendCurrency)}`
              : "No exchange fee on this corridor"}
          </Text>
          <Text style={styles.meta}>Recipient gets {formatMoney(quote.receiveAmount, receiveCurrency)}</Text>
          <Text style={styles.total}>You pay {formatMoney(quote.totalAmount, sendCurrency)}</Text>
        </View>
      ) : null}
      {showQuote && !quote && sendCurrency && receiveCurrency && Number(sendAmount) > 0 ? (
        <Text style={styles.error}>Exchange rate not available for this pair.</Text>
      ) : null}

      {sendPickerEnabled ? (
        <SheetPicker
          open={openSend}
          title="Pay in"
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
          title="They get"
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
  row: { marginBottom: 12, flexDirection: "row", gap: 8 },
  flex: { flex: 1 },
  passThrough: { pointerEvents: "none" },
  quote: {
    marginBottom: 16,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  meta: { fontSize: typeSize.meta, color: colors.muted, marginTop: 2 },
  total: { marginTop: 8, fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  error: { marginBottom: 16, fontSize: typeSize.meta, color: colors.danger },
})
