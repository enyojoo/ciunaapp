import { bitbankerRequest } from "./client"

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
  return bitbankerRequest<ExchangePredictionResponse>({
    method: "POST",
    path: "/api/v2/exchange-prediction",
    body: {
      volume: params.volume,
      give_currency: params.giveCurrency ?? "RUBR",
      take_currency: params.takeCurrency ?? "USDT",
    },
  })
}

export function numField(v: unknown): number | null {
  if (v == null) return null
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : null
}
