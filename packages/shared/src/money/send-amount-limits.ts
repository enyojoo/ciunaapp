/** Minimum send amount for RUB (Bitbanker SBP and product rule). */
export const MIN_RUB_SEND_AMOUNT = 1000

export function minSendAmountForCurrency(code: string | null | undefined): number | null {
  const c = String(code || "")
    .trim()
    .toUpperCase()
  if (c === "RUB") return MIN_RUB_SEND_AMOUNT
  return null
}

export function defaultSendAmountForCurrency(code: string | null | undefined): string {
  const min = minSendAmountForCurrency(code)
  return min != null ? String(min) : "10"
}

export function clampSendAmountForCurrency(amount: number, code: string | null | undefined): number {
  const min = minSendAmountForCurrency(code)
  if (min == null || !Number.isFinite(amount)) return amount
  return amount < min ? min : amount
}
