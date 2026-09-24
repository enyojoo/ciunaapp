import { roundMoney } from "@/utils/currency"
import { exchangePrediction, numField, type ExchangePredictionResponse } from "./prediction"

/**
 * RUB on-ramp + local payout:
 *   Office RUB→local → recipient amount.
 *   USDT needed for that payout (USD→local desk, USDT≈USD).
 *   Minimize Bitbanker invoice B so prediction(B).U ≥ USDT target; customer pays G.
 */

export type LocalPayoutFundingSnapshot = {
  /** Principal + Ciuna fee + logistics (before USDT sizing). */
  nominalInvoiceBaseB: number
  /** Bitbanker exchange-prediction volume (≥ nominal). */
  invoiceBaseB: number
  usdtRequiredForLocal: number
  usdtTargetWithReserves: number
  usdtFromBitbanker: number
  usdtDeskLocalPerUnit: number | null
  usdtDeskSource: "USD_OFFICE_RATE" | "USD_PEG" | "env_fallback" | null
}

export function leg2ReserveUsdt(): { minContributionUsdt: number; trc20FeeUsdt: number } {
  return {
    minContributionUsdt: Number(process.env.BITBANKER_MIN_CONTRIBUTION_USDT || "0"),
    trc20FeeUsdt: Number(process.env.BITBANKER_TRC20_FEE_USDT || "0"),
  }
}

export function resolveUsdtDeskRate(
  receiveCurrency: string,
  usdToLocalOfficeRate: number | null | undefined,
): { desk: number | null; source: LocalPayoutFundingSnapshot["usdtDeskSource"] } {
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

/** USDT to fund `receiveAmount` local at desk (local units per 1 USDT). */
export function usdtForLocalPayout(receiveAmount: number, deskLocalPerUsdt: number): number {
  return roundMoney(receiveAmount / deskLocalPerUsdt)
}

export function usdtTargetForLocalPayout(receiveAmount: number, deskLocalPerUsdt: number): number {
  const base = usdtForLocalPayout(receiveAmount, deskLocalPerUsdt)
  const { minContributionUsdt, trc20FeeUsdt } = leg2ReserveUsdt()
  return roundMoney(base + trc20FeeUsdt + minContributionUsdt)
}

type PredictionAtB = {
  invoiceBaseB: number
  grossG: number
  usdtU: number
  prediction: ExchangePredictionResponse
}

async function predictAtB(volume: number): Promise<PredictionAtB> {
  const prediction = await exchangePrediction({ volume })
  const grossG = numField(prediction.volume_give_prediction)
  const usdtU = numField(prediction.volume_take_final)
  if (grossG == null || usdtU == null) {
    throw new Error("Bitbanker prediction unavailable")
  }
  return { invoiceBaseB: volume, grossG, usdtU, prediction }
}

const BINARY_STEPS_MAX = 6
/** Skip minimize-B search when U is already within this USDT of target (saves Bitbanker round-trips). */
const USDT_TARGET_SLACK = 0.2

function scaleBForUsdtGap(b: number, usdtHave: number, usdtTarget: number): number {
  if (usdtHave <= 0) return roundMoney(b + 1)
  return roundMoney(Math.max(b + 1, b * (usdtTarget / usdtHave) * 1.002))
}

/** Smallest B ≥ nominalB with Bitbanker U ≥ usdtTarget (minimizes G; few Bitbanker calls). */
export async function solveInvoiceBaseForUsdtTarget(
  nominalB: number,
  usdtTarget: number,
  opts?: { floorPred?: PredictionAtB },
): Promise<PredictionAtB & { nominalInvoiceBaseB: number }> {
  const floorB = roundMoney(Math.max(nominalB, 1))
  const floorPred = opts?.floorPred?.invoiceBaseB === floorB ? opts.floorPred : await predictAtB(floorB)
  if (floorPred.usdtU >= usdtTarget) {
    return { ...floorPred, nominalInvoiceBaseB: nominalB }
  }

  let hiPass = scaleBForUsdtGap(floorB, floorPred.usdtU, usdtTarget)
  let hiPred = await predictAtB(hiPass)
  for (let bump = 0; hiPred.usdtU < usdtTarget && bump < 2; bump++) {
    hiPass = scaleBForUsdtGap(hiPass, hiPred.usdtU, usdtTarget)
    hiPred = await predictAtB(hiPass)
  }
  if (hiPred.usdtU < usdtTarget) {
    throw new Error("Quote does not meet minimum contribution for this corridor")
  }

  if (hiPred.usdtU - usdtTarget <= USDT_TARGET_SLACK) {
    return { ...hiPred, nominalInvoiceBaseB: nominalB }
  }

  let loFail = floorB
  for (let i = 0; i < BINARY_STEPS_MAX && roundMoney(hiPass - loFail) > 0.01; i++) {
    const mid = roundMoney((loFail + hiPass) / 2)
    if (mid <= loFail || mid >= hiPass) break
    const midPred = await predictAtB(mid)
    if (midPred.usdtU >= usdtTarget) {
      hiPass = mid
      hiPred = midPred
    } else {
      loFail = mid
    }
  }

  return { ...hiPred, nominalInvoiceBaseB: nominalB }
}
