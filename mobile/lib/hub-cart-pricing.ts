import { roundMoney } from "@/lib/money"
import { hubProductEffectivePrice } from "@/lib/money"
import type { RateRow } from "@/lib/fx"
import type { HubProduct } from "@/lib/types"

export interface HubCartPricingLine {
  hubProductId: string
  title: string
  unitPrice: number
  quantity: number
  lineTotal: number
  hubFeeReceive: number
}

export interface HubCartPricingTotals {
  currency: string
  lines: HubCartPricingLine[]
  subtotalReceive: number
  hubFeeReceive: number
  totalReceive: number
  totalSend: number
  transferFee: number
  total: number
  exchangeRate: number
}

function hubFeeFromReceive(fundedReceiveAmount: number, rate: number, feePercent: number): number {
  if (!Number.isFinite(fundedReceiveAmount) || fundedReceiveAmount <= 0 || rate <= 0 || feePercent <= 0) return 0
  return roundMoney((fundedReceiveAmount * feePercent) / 100 / rate)
}

function corridorFee(sendAmount: number, rateRow: RateRow): number {
  if (rateRow.fee_type === "fixed") return Number(rateRow.fee_amount) || 0
  if (rateRow.fee_type === "percentage") return (sendAmount * (Number(rateRow.fee_amount) || 0)) / 100
  return 0
}

/** Mirrors `api/lib/hub-cart-pricing.ts` — kept in sync by hand since mobile has no shared build step with api/web. */
export function computeHubCartTotals(
  items: { product: HubProduct; quantity: number }[],
  rateRow: RateRow,
): HubCartPricingTotals {
  if (!items.length) throw new Error("Cart is empty")

  const currency = String(items[0].product.fixed_currency || "").trim().toUpperCase()
  if (!currency) throw new Error("Product is missing a price currency")

  const lines: HubCartPricingLine[] = items.map(({ product, quantity }) => {
    const lineCurrency = String(product.fixed_currency || "").trim().toUpperCase()
    if (lineCurrency !== currency) throw new Error("Cart items must share the same price currency")
    const unitPrice = roundMoney(hubProductEffectivePrice(product))
    const lineTotal = roundMoney(unitPrice * quantity)
    const hubFeeReceive = hubFeeFromReceive(lineTotal, Number(rateRow.rate) || 0, Number(product.fee_percent) || 0)
    return { hubProductId: product.id, title: product.title, unitPrice, quantity, lineTotal, hubFeeReceive }
  })

  const subtotalReceive = roundMoney(lines.reduce((sum, l) => sum + l.lineTotal, 0))
  const hubFeeReceive = roundMoney(lines.reduce((sum, l) => sum + l.hubFeeReceive, 0))
  const totalReceive = roundMoney(subtotalReceive + hubFeeReceive)

  const rate = Number(rateRow.rate) || 0
  if (rate <= 0) throw new Error("Invalid exchange rate")
  const totalSend = roundMoney(totalReceive / rate)
  const transferFee = roundMoney(corridorFee(totalSend, rateRow))
  const total = roundMoney(totalSend + transferFee)

  return { currency, lines, subtotalReceive, hubFeeReceive, totalReceive, totalSend, transferFee, total, exchangeRate: rate }
}
