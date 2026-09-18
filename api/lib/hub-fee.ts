import type { ExchangeRate } from "@/types"
import { roundMoney } from "@/utils/currency"

/**
 * Hub service fee in **send currency**, as a percentage of the **funded (receive-side) amount**.
 * Same FX step as logistics percentage on cash-hand: (receive * pct / 100) / rate.
 */
export function computeHubFeeFromReceive(
  fundedReceiveAmount: number,
  rate: Pick<ExchangeRate, "rate"> | null | undefined,
  feePercent: number,
): number {
  if (!rate || !Number.isFinite(fundedReceiveAmount) || fundedReceiveAmount <= 0) return 0
  const fx = rate.rate
  if (!Number.isFinite(fx) || fx <= 0) return 0
  const pct = Number(feePercent) || 0
  if (pct <= 0) return 0
  const inReceive = (fundedReceiveAmount * pct) / 100
  return roundMoney(inReceive / fx)
}
