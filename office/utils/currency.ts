// Money formatting helpers shared by Office screens.

export const formatNumber = (num: number): string => {
  if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T'
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K'
  return num.toFixed(0)
}

export function roundMoney(amount: number, fractionDigits = 2): number {
  if (!Number.isFinite(amount)) return 0
  const f = 10 ** fractionDigits
  return Math.round(amount * f) / f
}

export function formatAmountPlain(amount: number, fractionDigits = 2): string {
  return roundMoney(amount, fractionDigits).toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

export function formatExchangeRateForEmail(rate: number): string {
  if (!Number.isFinite(rate)) return "0"
  const cleaned = Number.parseFloat(Number(rate).toPrecision(12))
  return cleaned.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  })
}

export const formatCurrency = (amount: number, currency: string): string => {
  return formatCurrencySymbolOnly(amount, currency)
}

export const formatCurrencyWithRounding = (amount: number, currency: string): string => {
  const formattedNumber = formatNumber(amount)
  const symbol = getCurrencyNarrowSymbol(currency)
  return `${symbol === currency ? `${currency} ` : symbol}${formattedNumber}`
}

const KNOWN_SYMBOLS: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", RUB: "₽", NGN: "₦" }

export function getCurrencyNarrowSymbol(currencyCode: string | null | undefined): string {
  const code = String(currencyCode || "USD").trim().toUpperCase() || "USD"
  const known = KNOWN_SYMBOLS[code]
  if (known) return known
  try {
    const part = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    })
      .formatToParts(0)
      .find((p) => p.type === "currency")
    return part?.value || code
  } catch {
    return code
  }
}

export function formatCurrencySymbolOnly(amount: number, currencyCode: string | null | undefined): string {
  if (!Number.isFinite(amount)) return "—"
  const rounded = roundMoney(amount)
  const symbol = getCurrencyNarrowSymbol(currencyCode)
  return `${symbol === currencyCode ? `${currencyCode} ` : symbol}${rounded.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
