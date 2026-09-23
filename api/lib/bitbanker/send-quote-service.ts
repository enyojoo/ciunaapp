import type { SupabaseClient } from "@supabase/supabase-js"
import { currencyService } from "@/lib/database"
import { computeLogisticsFee, resolveFulfillment } from "@/lib/send-fulfillment"
import { roundMoney } from "@/utils/currency"
import { exchangePrediction, numField } from "./prediction"
import { isBitbankerConfigured } from "./config"

const QUOTE_TTL_MS = 60_000

export type CreateSendQuoteInput = {
  userId: string
  sendAmount?: number
  receiveAmount?: number
  sendCurrency: string
  receiveCurrency: string
  recipientId?: string | null
  fulfillmentType?: "bank_transfer" | "cash_hand"
  deliveryAddressLine?: string | null
  deliveryPhone?: string | null
  deliveryAddressId?: string | null
}

export async function createSendQuote(admin: SupabaseClient, input: CreateSendQuoteInput) {
  if (!isBitbankerConfigured()) {
    throw new Error("Bitbanker is not configured")
  }

  const sendCurrency = input.sendCurrency.trim().toUpperCase()
  const receiveCurrency = input.receiveCurrency.trim().toUpperCase()
  if (sendCurrency !== "RUB") {
    throw new Error("Bitbanker quotes are only supported for RUB send currency")
  }

  const rateData = await currencyService.getRate(sendCurrency, receiveCurrency)
  if (!rateData) throw new Error("Exchange rate not available")

  let sendAmount = input.sendAmount
  let receiveAmount = input.receiveAmount
  const rate = Number(rateData.rate)
  if (!rate || rate <= 0) throw new Error("Invalid exchange rate")

  if (sendAmount != null && sendAmount > 0) {
    receiveAmount = roundMoney(sendAmount * rate)
  } else if (receiveAmount != null && receiveAmount > 0) {
    sendAmount = roundMoney(receiveAmount / rate)
  } else {
    throw new Error("Send or receive amount is required")
  }

  if (!sendAmount || !receiveAmount) throw new Error("Invalid amounts")

  const fulfillmentCheck = resolveFulfillment(receiveAmount, rateData)
  const fulfillment =
    fulfillmentCheck.ok &&
    fulfillmentCheck.fulfillment === "cash_hand" &&
    input.fulfillmentType === "cash_hand"
      ? "cash_hand"
      : "bank_transfer"

  if (fulfillment === "bank_transfer" && !input.recipientId) {
    throw new Error("Recipient is required")
  }

  let feeAmount = 0
  const feeType = rateData.fee_type || "free"
  if (feeType === "fixed") feeAmount = Number(rateData.fee_amount) || 0
  else if (feeType === "percentage") feeAmount = (sendAmount * (Number(rateData.fee_amount) || 0)) / 100

  const logisticsFeeAmount =
    fulfillment === "cash_hand" ? computeLogisticsFee(receiveAmount, fulfillment, rateData) : 0

  const invoiceBaseB = roundMoney(sendAmount + feeAmount + logisticsFeeAmount)

  const prediction = await exchangePrediction({ volume: invoiceBaseB })
  const grossG = numField(prediction.volume_give_prediction)
  const usdtU = numField(prediction.volume_take_final)
  if (grossG == null || usdtU == null) {
    throw new Error("Bitbanker prediction unavailable")
  }

  const paymentProcessingFee = roundMoney(Math.max(0, grossG - invoiceBaseB))
  const totalAmount = roundMoney(grossG)

  const minContribution = Number(process.env.BITBANKER_MIN_CONTRIBUTION_USDT || "0")
  const deskRate = Number(process.env.BITBANKER_DESTINATION_DESK_RATE || "0")
  const trc20Fee = Number(process.env.BITBANKER_TRC20_FEE_USDT || "0")
  if (deskRate > 0) {
    const payoutCost = receiveAmount / deskRate
    const projected = usdtU - payoutCost - trc20Fee
    if (projected < minContribution) {
      throw new Error("Quote does not meet minimum contribution for this corridor")
    }
  }

  const expiresAt = new Date(Date.now() + QUOTE_TTL_MS).toISOString()

  const { data: quote, error } = await admin
    .from("send_quotes")
    .insert({
      user_id: input.userId,
      status: "open",
      send_amount: sendAmount,
      send_currency: sendCurrency,
      receive_amount: receiveAmount,
      receive_currency: receiveCurrency,
      exchange_rate: rate,
      fee_amount: roundMoney(feeAmount),
      fee_type: feeType,
      logistics_fee_amount: roundMoney(logisticsFeeAmount),
      payment_processing_fee: paymentProcessingFee,
      total_amount: totalAmount,
      invoice_base_b: invoiceBaseB,
      predicted_gross_g: grossG,
      predicted_usdt_u: usdtU,
      recipient_id: fulfillment === "cash_hand" ? null : input.recipientId ?? null,
      fulfillment_type: fulfillment,
      delivery_address_line: input.deliveryAddressLine ?? null,
      delivery_phone: input.deliveryPhone ?? null,
      delivery_address_id: input.deliveryAddressId ?? null,
      payment_method_intent: "bitbanker",
      quote_snapshot: { prediction },
      expires_at: expiresAt,
    })
    .select("*")
    .single()

  if (error) throw error
  return quote
}

export async function getOpenQuote(admin: SupabaseClient, quoteId: string, userId: string) {
  const { data, error } = await admin
    .from("send_quotes")
    .select("*")
    .eq("id", quoteId)
    .eq("user_id", userId)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error("Quote not found")
  if (data.status !== "open") throw new Error("Quote is no longer available")
  if (new Date(data.expires_at).getTime() < Date.now()) {
    await admin.from("send_quotes").update({ status: "expired" }).eq("id", quoteId)
    throw new Error("Quote expired")
  }
  return data
}
