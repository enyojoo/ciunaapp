import { getPredictionSbp, numField } from "./prediction"

export type SbpFeeSchedule = {
  feePct: number
  feeAbsMinRub: number
  minGrossRub: number | null
  maxGrossRub: number | null
  currencyCode: string | null
  fetchedAt: number
}

let cache: SbpFeeSchedule | null = null
const TTL_MS = 5 * 60 * 1000

/** Bitbanker SBP fee table from GET /api/v2/prediction-sbp (e.g. 2.1%, min 210 RUB). */
export async function getSbpFeeSchedule(force = false): Promise<SbpFeeSchedule> {
  if (!force && cache && Date.now() - cache.fetchedAt < TTL_MS) return cache

  const raw = await getPredictionSbp()
  const schedule: SbpFeeSchedule = {
    feePct: numField(raw.sbp_fee_pct) ?? 0,
    feeAbsMinRub: numField(raw.sbp_fee_abs) ?? 0,
    minGrossRub: numField(raw.min_sbp_limit),
    maxGrossRub: numField(raw.max_sbp_limit),
    currencyCode: typeof raw.currency_code === "string" ? raw.currency_code : null,
    fetchedAt: Date.now(),
  }
  cache = schedule
  return schedule
}

export function sbpProcessingFeeForInvoiceBase(invoiceBaseRub: number, schedule: SbpFeeSchedule): number {
  if (invoiceBaseRub <= 0) return 0
  const pctFee = (invoiceBaseRub * schedule.feePct) / 100
  return Math.max(schedule.feeAbsMinRub, pctFee)
}
