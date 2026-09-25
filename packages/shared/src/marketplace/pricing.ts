import type { MarketplaceTotals } from "./types"

// All arithmetic is rational/integer until the final JSON boundary. Existing supported
// marketplace currencies use two fraction digits. Rates/percentages retain eight.
const scale = BigInt(100000000)
function decimal(value: number | string): bigint {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0 || n > 1e10) throw new Error("INVALID_AMOUNT")
  return BigInt(n.toFixed(8).replace(".", ""))
}
function divide(n: bigint, d: bigint): bigint {
  if (d <= BigInt(0)) throw new Error("INVALID_RATE")
  return (n + d / BigInt(2)) / d
}
function cents(n: number | string) {
  return divide(decimal(n) * BigInt(100), scale)
}
function number(n: bigint) {
  if (n > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("INVALID_AMOUNT")
  return Number(n) / 100
}
export function marketplaceTotals(input: {
  lines: { unitPrice: number; quantity: number; feePercent: number }[]
  productCurrency: string
  payCurrency: string
  rate: number
  deliveryFee?: number
  corridorFeeType?: string
  corridorFeeAmount?: number
}): MarketplaceTotals {
  if (!input.lines.length) throw new Error("EMPTY_ORDER")
  let subtotal = BigInt(0),
    fee = BigInt(0)
  for (const line of input.lines) {
    if (
      !Number.isSafeInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > 10000 ||
      line.unitPrice <= 0
    )
      throw new Error("INVALID_AMOUNT")
    const amount = cents(line.unitPrice) * BigInt(line.quantity)
    subtotal += amount
    fee += divide(amount * decimal(line.feePercent), scale * BigInt(100))
  }
  const delivery = cents(input.deliveryFee || 0)
  const converted = divide((subtotal + fee + delivery) * scale, decimal(input.rate))
  const corridor =
    input.corridorFeeType === "fixed"
      ? cents(input.corridorFeeAmount || 0)
      : input.corridorFeeType === "percentage"
        ? divide(converted * decimal(input.corridorFeeAmount || 0), scale * BigInt(100))
        : BigInt(0)
  return {
    productCurrency: input.productCurrency,
    payCurrency: input.payCurrency,
    subtotal: number(subtotal),
    marketplaceFee: number(fee),
    deliveryFee: number(delivery),
    exchangeRate: input.rate,
    convertedSubtotal: number(converted),
    corridorFee: number(corridor),
    total: number(converted + corridor),
  }
}
export function marketplaceDeadline(
  line: string,
  rail: string,
  now: number,
  slotStart?: string,
  cutoffMinutes = 60,
): string {
  const minutes = rail === "yookassa" ? 15 : line === "food" ? 30 : line === "experts" ? 60 : 120
  const deadline = Math.min(
    now + minutes * 60000,
    slotStart ? Date.parse(slotStart) - cutoffMinutes * 60000 : Infinity,
  )
  if (!Number.isFinite(deadline) || deadline <= now) throw new Error("SLOT_UNAVAILABLE")
  return new Date(deadline).toISOString()
}
