import type { ExchangeRate } from "@/types"

/** True when "currency you'll pay with" is the product (funded) currency — spot is 1:1, no corridor row required. */
export function hubPayMatchesProductCurrency(sendCurrency: string, receiveCurrency: string): boolean {
  return (
    String(sendCurrency || "").trim().toUpperCase() === String(receiveCurrency || "").trim().toUpperCase()
  )
}

export function hubSyntheticSameCurrencyRateRow(fromCurrency: string, toCurrency: string): ExchangeRate {
  return {
    id: "hub-same-currency",
    from_currency: String(fromCurrency || "").trim(),
    to_currency: String(toCurrency || "").trim(),
    rate: 1,
    fee_type: "free",
    fee_amount: 0,
    status: "active",
    created_at: "",
    updated_at: "",
  }
}
