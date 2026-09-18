import type { HubProductRow } from "@/lib/hub-types"

/** List price: explicit `list_price`, else legacy `fixed_amount`. */
export function hubProductListPrice(p: HubProductRow): number | null {
  const lp = p.list_price
  if (lp != null && Number.isFinite(Number(lp)) && Number(lp) > 0) return Number(lp)
  const fa = p.fixed_amount
  if (fa != null && Number.isFinite(Number(fa)) && Number(fa) > 0) return Number(fa)
  return null
}

/** Optional sale price when set and positive. */
export function hubProductSalePrice(p: HubProductRow): number | null {
  const sp = p.sale_price
  if (sp != null && Number.isFinite(Number(sp)) && Number(sp) > 0) return Number(sp)
  return null
}

/** Amount the customer pays for fixed-priced products (sale if set, otherwise list). */
export function hubProductEffectivePrice(p: HubProductRow): number {
  const list = hubProductListPrice(p) ?? 0
  const sale = hubProductSalePrice(p)
  if (sale != null) return sale
  return list
}

/** Show struck-through list when sale differs from list (typical promo). */
export function hubProductShowListStrike(p: HubProductRow): boolean {
  const list = hubProductListPrice(p)
  const sale = hubProductSalePrice(p)
  return list != null && sale != null && sale > 0 && sale !== list
}
