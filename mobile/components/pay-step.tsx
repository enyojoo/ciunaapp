import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { Field } from "./field"
import { SheetPicker } from "./sheet-picker"
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
  const sendable = useMemo(() => currencies.filter((c) => c.can_send !== false), [currencies])
  const receivable = useMemo(() => currencies.filter((c) => c.can_receive !== false), [currencies])
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
        <Pressable style={styles.flex} onPress={() => setOpenSend(true)}>
          <View style={styles.passThrough}>
            <Field label="Pay in" value={sendCurrency} editable={false} />
          </View>
        </Pressable>
        <Pressable style={styles.flex} onPress={() => setOpenRecv(true)}>
          <View style={styles.passThrough}>
            <Field label="They get" value={receiveCurrency} editable={false} />
          </View>
        </Pressable>
      </View>
      {showQuote && quote ? (
        <View style={styles.quote}>
          <Text style={styles.meta}>
            Rate 1 {sendCurrency} = {quote.rate.toFixed(4)} {receiveCurrency}
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

      <SheetPicker
        open={openSend}
        title="Pay in"
        items={sendable}
        keyExtractor={(c) => c.code}
        labelExtractor={(c) => `${c.code}${c.name ? ` · ${c.name}` : ""}`}
        selectedId={sendCurrency}
        onSelect={(c) => onChangeSendCurrency(c.code)}
        onClose={() => setOpenSend(false)}
      />
      <SheetPicker
        open={openRecv}
        title="They get"
        items={receivable}
        keyExtractor={(c) => c.code}
        labelExtractor={(c) => `${c.code}${c.name ? ` · ${c.name}` : ""}`}
        selectedId={receiveCurrency}
        onSelect={(c) => onChangeReceiveCurrency(c.code)}
        onClose={() => setOpenRecv(false)}
      />
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
