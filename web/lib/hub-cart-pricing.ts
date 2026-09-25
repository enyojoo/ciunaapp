import { roundMoney } from "@/utils/currency"
import { marketplaceTotals } from "@ciuna/shared"
import { hubProductEffectivePrice } from "@/lib/hub-product-price"
import type { HubProductRow } from "@/lib/hub-types"
import type { ExchangeRate } from "@/types"

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
  /** Sum of line totals, before hub fee. */
  subtotalReceive: number
  /** Sum of each line's hub fee (per-product `fee_percent`), in receive currency. */
  hubFeeReceive: number
  /** subtotalReceive + hubFeeReceive, in receive currency. */
  totalReceive: number
  /** totalReceive converted to send currency at `rate`. */
  totalSend: number
  /** Corridor transfer fee, in send currency. */
  transferFee: number
  /** totalSend + transferFee, in send currency — the amount the customer pays. */
  total: number
  exchangeRate: number
}

export function computeHubCartTotals(
  items: { product: HubProductRow; quantity: number }[],
  rateRow: ExchangeRate,
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
    if (lineCurrency !== currency) {
      throw new Error("Cart items must share the same price currency")
    }
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
    corridorFeeType: rateRow.fee_type,
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
