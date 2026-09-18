export function hubProductListPrice(p: {
  list_price?: number | null
  fixed_amount?: number | null
}): number | null {
  const lp = p.list_price
  if (lp != null && Number.isFinite(Number(lp)) && Number(lp) > 0) return Number(lp)
  const fa = p.fixed_amount
  if (fa != null && Number.isFinite(Number(fa)) && Number(fa) > 0) return Number(fa)
  return null
}

export function hubProductSalePrice(p: { sale_price?: number | null }): number | null {
  const sp = p.sale_price
  if (sp != null && Number.isFinite(Number(sp)) && Number(sp) > 0) return Number(sp)
  return null
}

export function hubProductEffectivePrice(p: {
  list_price?: number | null
  sale_price?: number | null
  fixed_amount?: number | null
}): number {
  const list = hubProductListPrice(p) ?? 0
  const sale = hubProductSalePrice(p)
  if (sale != null) return sale
  return list
}

export function hubProductShowListStrike(p: {
  list_price?: number | null
  sale_price?: number | null
  fixed_amount?: number | null
}): boolean {
  const list = hubProductListPrice(p)
  const sale = hubProductSalePrice(p)
  return list != null && sale != null && sale > 0 && sale !== list
}

export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** Same corridor symbols as web (`formatCurrencySymbolOnly`). Hermes often prints RUB instead of ₽. */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  RUB: "₽",
  NGN: "₦",
}

export function getCurrencyNarrowSymbol(currencyCode: string | null | undefined): string {
  const code = String(currencyCode || "").trim().toUpperCase()
  if (!code) return ""
  if (CURRENCY_SYMBOLS[code]) return CURRENCY_SYMBOLS[code]
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

export function formatMoney(amount: number | null | undefined, currency?: string | null): string {
  if (amount == null || !Number.isFinite(Number(amount))) return "—"
  const rounded = roundMoney(Number(amount))
  const cur = String(currency || "").trim().toUpperCase()
  const num = rounded.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  if (!cur) return num
  const symbol = getCurrencyNarrowSymbol(cur)
  return `${symbol === cur ? `${cur} ` : symbol}${num}`
}

/** Catalog card amount: drop trailing .00 like web. */
export function formatCardPrice(amount: number | null | undefined, currency?: string | null): string {
  return formatMoney(amount, currency).replace(/\.00\b/, "")
}
