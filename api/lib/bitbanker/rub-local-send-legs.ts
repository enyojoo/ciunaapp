import { SEND_QUOTE_ERROR_CODE } from "@ciuna/shared"
import { roundMoney } from "@/utils/currency"
import { SendQuoteError } from "./send-quote-errors"

/**
 * RUB “send to local” = Easner direct-to-local shape:
 *   Leg 1: customer pays RUB via SBP → Bitbanker converts to USDT (prediction).
 *   Leg 2: USDT must fund the recipient’s local payout (e.g. NGN via Office).
 *
 * Leg-2 desk uses the same number as Office **USD → local** (`exchange_rates.rate`):
 * local units per 1 USD, treated as local per 1 USDT (USD ≈ USDT).
 */

export type RubLocalSendLegSnapshot = {
  sendAmountRub: number
  receiveAmountLocal: number
  receiveCurrency: string
  invoiceBaseB: number
  sbpGrossG: number
  usdtFromBitbanker: number
  usdtForLocalPayout: number | null
  /** Local per 1 USDT; sourced from USD→local Office rate when set. */
  usdtDeskLocalPerUnit: number | null
  usdtDeskSource: "USD_OFFICE_RATE" | "USD_PEG" | "env_fallback" | null
}

/**
 * Local currency units per 1 USDT from Office USD→receive rate (or 1 when receive is USD).
 */
export function resolveUsdtDeskRate(
  receiveCurrency: string,
  usdToLocalOfficeRate: number | null | undefined,
): { desk: number | null; source: RubLocalSendLegSnapshot["usdtDeskSource"] } {
  const recv = receiveCurrency.trim().toUpperCase()
  if (recv === "USD") {
    return { desk: 1, source: "USD_PEG" }
  }
  const fromOffice = Number(usdToLocalOfficeRate)
  if (Number.isFinite(fromOffice) && fromOffice > 0) {
    return { desk: fromOffice, source: "USD_OFFICE_RATE" }
  }
  const fromEnv = Number(process.env.BITBANKER_DESTINATION_DESK_RATE || "0")
  if (fromEnv > 0) {
    return { desk: fromEnv, source: "env_fallback" }
  }
  return { desk: null, source: null }
}

/** USDT needed to deliver `receiveAmount` at the desk (local per 1 USDT). */
export function usdtForLocalPayout(receiveAmount: number, deskLocalPerUsdt: number | null): number | null {
  if (deskLocalPerUsdt == null || !Number.isFinite(receiveAmount) || receiveAmount <= 0) return null
  return roundMoney(receiveAmount / deskLocalPerUsdt)
}

export function assertLeg2UsdtCoverage(input: {
  usdtFromBitbanker: number
  usdtForLocalPayout: number
  minContributionUsdt?: number
  trc20FeeUsdt?: number
}): void {
  const minContribution = input.minContributionUsdt ?? Number(process.env.BITBANKER_MIN_CONTRIBUTION_USDT || "0")
  const trc20Fee = input.trc20FeeUsdt ?? Number(process.env.BITBANKER_TRC20_FEE_USDT || "0")
  const projected = input.usdtFromBitbanker - input.usdtForLocalPayout - trc20Fee
  if (projected < minContribution) {
    throw new SendQuoteError(
      SEND_QUOTE_ERROR_CODE.MIN_CONTRIBUTION,
      "Quote does not meet minimum contribution for this corridor",
    )
  }
}
