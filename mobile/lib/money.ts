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

export function formatMoney(amount: number | null | undefined, currency?: string | null): string {
  if (amount == null || !Number.isFinite(Number(amount))) return "—"
  const n = Number(amount)
  const cur = (currency || "").toUpperCase()
  try {
    return new Intl.NumberFormat(undefined, {
      style: cur ? "currency" : "decimal",
      currency: cur || "USD",
      maximumFractionDigits: 2,
    }).format(n)
  } catch {
    return cur ? `${n.toFixed(2)} ${cur}` : n.toFixed(2)
  }
}

export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
