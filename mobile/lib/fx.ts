import { roundMoney } from "./money"

export type RateRow = {
  from_currency: string
  to_currency: string
  rate: number
  fee_type?: string | null
  fee_amount?: number | null
  status?: string | null
}

export type Quote = {
  rate: number
  feeType: string
  feeAmount: number
  receiveAmount: number
  totalAmount: number
}

export function findRate(rates: RateRow[], from: string, to: string): RateRow | null {
  const a = from.trim().toUpperCase()
  const b = to.trim().toUpperCase()
  if (!a || !b) return null
  if (a === b) {
    return { from_currency: a, to_currency: b, rate: 1, fee_type: "free", fee_amount: 0, status: "active" }
  }
  const direct = rates.find(
    (r) =>
      String(r.from_currency).toUpperCase() === a &&
      String(r.to_currency).toUpperCase() === b &&
      (r.status == null || r.status === "active"),
  )
  if (direct && Number(direct.rate) > 0) return direct
  const reverse = rates.find(
    (r) =>
      String(r.from_currency).toUpperCase() === b &&
      String(r.to_currency).toUpperCase() === a &&
      (r.status == null || r.status === "active"),
  )
  if (reverse && Number(reverse.rate) > 0) {
    return {
      ...reverse,
      from_currency: a,
      to_currency: b,
      rate: 1 / Number(reverse.rate),
    }
  }
  return null
}

export function quoteSend(sendAmount: number, rate: RateRow | null): Quote | null {
  if (!rate || !Number.isFinite(sendAmount) || sendAmount <= 0) return null
  const fx = Number(rate.rate) || 0
  if (fx <= 0) return null
  let feeAmount = 0
  const feeType = String(rate.fee_type || "free")
  if (feeType === "fixed") feeAmount = Number(rate.fee_amount) || 0
  else if (feeType === "percentage") feeAmount = (sendAmount * (Number(rate.fee_amount) || 0)) / 100
  const receiveAmount = roundMoney(sendAmount * fx)
  const totalAmount = roundMoney(sendAmount + feeAmount)
  return { rate: fx, feeType, feeAmount: roundMoney(feeAmount), receiveAmount, totalAmount }
}
