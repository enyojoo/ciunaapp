import { roundMoney } from "@/utils/currency"
import { bitbankerRequest } from "./client"

const PREDICTION_CACHE_TTL_MS = 60_000
const PREDICTION_CACHE_MAX = 256
const predictionCache = new Map<string, { expiresAt: number; value: ExchangePredictionResponse }>()

function predictionCacheKey(volume: number, give: string, take: string): string {
  return `${give}:${take}:${roundMoney(volume)}`
}

function prunePredictionCache() {
  if (predictionCache.size <= PREDICTION_CACHE_MAX) return
  const now = Date.now()
  for (const [k, v] of predictionCache) {
    if (v.expiresAt <= now) predictionCache.delete(k)
  }
  while (predictionCache.size > PREDICTION_CACHE_MAX) {
    const first = predictionCache.keys().next().value
    if (first == null) break
    predictionCache.delete(first)
  }
}

export type ExchangePredictionResponse = Record<string, unknown> & {
  volume_give_prediction?: number | string
  volume_take_final?: number | string
  volume_take_prediction?: number | string
  comission1?: number | string
  comission2?: number | string
  comission3?: number | string
  full_sign?: string
}

export async function getPredictionSbp(): Promise<Record<string, unknown>> {
  return bitbankerRequest({
    method: "GET",
    path: "/api/v2/prediction-sbp",
    signBody: false,
  })
}

export async function exchangePrediction(params: {
  volume: number
  giveCurrency?: string
  takeCurrency?: string
}): Promise<ExchangePredictionResponse> {
  const give = params.giveCurrency ?? "RUBR"
  const take = params.takeCurrency ?? "USDT"
  const volume = roundMoney(params.volume)
  const key = predictionCacheKey(volume, give, take)
  const now = Date.now()
  const cached = predictionCache.get(key)
  if (cached && cached.expiresAt > now) return cached.value

  const value = await bitbankerRequest<ExchangePredictionResponse>({
    method: "POST",
    path: "/api/v2/exchange-prediction",
    body: {
      volume,
      give_currency: give,
      take_currency: take,
    },
  })
  predictionCache.set(key, { expiresAt: now + PREDICTION_CACHE_TTL_MS, value })
  prunePredictionCache()
  return value
}

export function numField(v: unknown): number | null {
  if (v == null) return null
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : null
}
