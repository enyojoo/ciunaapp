import { roundMoney } from "@/utils/currency"
import { computeHubFeeFromReceive } from "@/lib/hub-fee"
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

function computeCorridorFee(sendAmount: number, rateRow: ExchangeRate): number {
  if (rateRow.fee_type === "free") return 0
  if (rateRow.fee_type === "fixed") return Number(rateRow.fee_amount) || 0
  if (rateRow.fee_type === "percentage") return (sendAmount * (Number(rateRow.fee_amount) || 0)) / 100
  return 0
}

/**
 * Computes cart totals from live product rows. Every item must share the same `fixed_currency`
 * (a cart is single-vendor, and mixing currencies within one order isn't supported) — throws a
 * clear error otherwise so the UI can surface it instead of producing a wrong total.
 */
export function computeHubCartTotals(
  items: { product: HubProductRow; quantity: number }[],
  rateRow: ExchangeRate,
): HubCartPricingTotals {
  if (!items.length) throw new Error("Cart is empty")

  const currency = String(items[0].product.fixed_currency || "").trim().toUpperCase()
  if (!currency) throw new Error("Product is missing a price currency")

  const lines: HubCartPricingLine[] = items.map(({ product, quantity }) => {
    const lineCurrency = String(product.fixed_currency || "").trim().toUpperCase()
    if (lineCurrency !== currency) {
      throw new Error("Cart items must share the same price currency")
    }
    const unitPrice = roundMoney(hubProductEffectivePrice(product))
    const lineTotal = roundMoney(unitPrice * quantity)
    const hubFeeReceive = computeHubFeeFromReceive(lineTotal, rateRow, Number(product.fee_percent) || 0)
    return { hubProductId: product.id, title: product.title, unitPrice, quantity, lineTotal, hubFeeReceive }
  })

  const subtotalReceive = roundMoney(lines.reduce((sum, l) => sum + l.lineTotal, 0))
  const hubFeeReceive = roundMoney(lines.reduce((sum, l) => sum + l.hubFeeReceive, 0))
  const totalReceive = roundMoney(subtotalReceive + hubFeeReceive)

  const rate = Number(rateRow.rate) || 0
  if (rate <= 0) throw new Error("Invalid exchange rate")
  const totalSend = roundMoney(totalReceive / rate)
  const transferFee = roundMoney(computeCorridorFee(totalSend, rateRow))
  const total = roundMoney(totalSend + transferFee)

  return { currency, lines, subtotalReceive, hubFeeReceive, totalReceive, totalSend, transferFee, total, exchangeRate: rate }
}
