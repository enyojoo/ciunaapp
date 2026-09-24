/**
 * Display rate in "1 {send} = X {receive}" copy.
 * - Rate ≥ 1: two decimal places (e.g. 14.09, 1,409.90).
 * - Rate < 1: more fractional digits so the value stays meaningful.
 */
export function formatExchangeRateDisplay(rate: number): string {
  if (!Number.isFinite(rate) || rate <= 0) return "—"
  const r = Number(rate)

  if (r >= 1) {
    return r.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  if (r >= 0.01) {
    return r.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })
  }

  const decimals = Math.min(8, Math.max(4, Math.ceil(-Math.log10(r)) + 2))
  const trimmed = Number(r.toFixed(decimals))
  return trimmed.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })
}
