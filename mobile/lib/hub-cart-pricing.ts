import { marketplaceTotals } from "@ciuna/shared"
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

export function computeHubCartTotals(
  items: { product: HubProduct; quantity: number }[],
  rateRow: RateRow,
): HubCartPricingTotals {
  if (!items.length) throw new Error("Cart is empty")

  const currency = String(items[0].product.fixed_currency || "")
    .trim()
    .toUpperCase()
  if (!currency) throw new Error("Product is missing a price currency")

  const lines: HubCartPricingLine[] = items.map(({ product, quantity }) => {
    const lineCurrency = String(product.fixed_currency || "")
      .trim()
      .toUpperCase()
    if (lineCurrency !== currency) throw new Error("Cart items must share the same price currency")
    const unitPrice = roundMoney(hubProductEffectivePrice(product))
    const lineTotal = roundMoney(unitPrice * quantity)
    const hubFeeReceive = marketplaceTotals({
      lines: [{ unitPrice, quantity, feePercent: Number(product.fee_percent) || 0 }],
      productCurrency: currency,
      payCurrency: currency,
      rate: 1,
    }).marketplaceFee
    return { hubProductId: product.id, title: product.title, unitPrice, quantity, lineTotal, hubFeeReceive }
  })

  const rate = Number(rateRow.rate)
  const totals = marketplaceTotals({
    lines: items.map(({ product, quantity }) => ({
      unitPrice: hubProductEffectivePrice(product),
      quantity,
      feePercent: Number(product.fee_percent) || 0,
    })),
    productCurrency: currency,
    payCurrency: rateRow.from_currency,
    rate,
    corridorFeeType: rateRow.fee_type || undefined,
    corridorFeeAmount: Number(rateRow.fee_amount) || 0,
  })
  return {
    currency,
    lines,
    subtotalReceive: totals.subtotal,
    hubFeeReceive: totals.marketplaceFee,
    totalReceive: roundMoney(totals.subtotal + totals.marketplaceFee),
    totalSend: totals.convertedSubtotal,
    transferFee: totals.corridorFee,
    total: totals.total,
    exchangeRate: rate,
  }
}
