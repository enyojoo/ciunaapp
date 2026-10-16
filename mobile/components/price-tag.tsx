import { StyleSheet, Text, View } from "react-native"
import { formatCardPrice } from "@/lib/money"
import { colors, type as typeSize } from "@/lib/theme"

const SIZES = {
  sm: { prefix: 11, price: 15, strike: 11, gap: 4 },
  md: { prefix: 12, price: 18, strike: 12, gap: 5 },
  lg: { prefix: typeSize.meta, price: 22, strike: typeSize.meta, gap: 6 },
} as const

/**
 * One price: an optional lead-in ("Pay from"), the old price struck through, then the amount.
 * Whole amounts drop their cents (cents stay in breakdowns, which use formatMoney).
 */
export function PriceTag({
  amount,
  currency,
  strike,
  prefix,
  size = "sm",
}: {
  amount?: number | null
  currency?: string | null
  /** The list price to show struck through when the amount is a sale price. */
  strike?: number | null
  prefix?: string
  size?: keyof typeof SIZES
}) {
  const s = SIZES[size]
  return (
    <View style={[styles.row, { gap: s.gap }]}>
      {prefix ? <Text style={{ fontSize: s.prefix, fontWeight: "500", color: colors.muted }}>{prefix}</Text> : null}
      {strike != null ? (
        <Text style={{ fontSize: s.strike, color: colors.muted, textDecorationLine: "line-through" }}>
          {formatCardPrice(strike, currency)}
        </Text>
      ) : null}
      {amount != null ? (
        <Text style={{ fontSize: s.price, fontWeight: "700", color: colors.text }}>{formatCardPrice(amount, currency)}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline" },
})
