import type { SupabaseClient } from "@supabase/supabase-js"
import { currencyService } from "@/lib/database"
import { computeLogisticsFee, resolveFulfillment } from "@/lib/send-fulfillment"
import { MIN_RUB_SEND_AMOUNT, SEND_QUOTE_ERROR_CODE } from "@ciuna/shared"
import { SendQuoteError } from "./send-quote-errors"
import { roundMoney } from "@/utils/currency"
import { exchangePrediction, numField } from "./prediction"
import { isBitbankerConfigured } from "./config"
import {
  assertLeg2UsdtCoverage,
  maxLocalPayoutFromUsdt,
  type RubLocalSendLegSnapshot,
  resolveUsdtDeskRate,
  usdtForLocalPayout,
} from "./rub-local-send-legs"

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

export type SendQuoteBreakdown = {
  sendAmount: number
  receiveAmount: number
  sendCurrency: string
  receiveCurrency: string
  exchangeRate: number
  feeAmount: number
  feeType: string
  logisticsFeeAmount: number
  paymentProcessingFee: number
  totalAmount: number
  invoiceBaseB: number
  predictedGrossG: number
  predictedUsdtU: number
  fulfillment: "bank_transfer" | "cash_hand"
  quoteSnapshot: { prediction: unknown; leg2?: RubLocalSendLegSnapshot }
}

export async function computeSendQuoteBreakdown(
  input: CreateSendQuoteInput & { skipRecipientCheck?: boolean; skipMinContributionCheck?: boolean },
): Promise<SendQuoteBreakdown> {
  if (!isBitbankerConfigured()) {
    throw new Error("Bitbanker is not configured")
  }

  const sendCurrency = input.sendCurrency.trim().toUpperCase()
  const receiveCurrency = input.receiveCurrency.trim().toUpperCase()
  if (sendCurrency !== "RUB") {
    throw new Error("Bitbanker quotes are only supported for RUB send currency")
  }

  const rateData = await currencyService.getRate(sendCurrency, receiveCurrency)
  if (!rateData) {
    throw new SendQuoteError(SEND_QUOTE_ERROR_CODE.RATE_UNAVAILABLE, "Exchange rate not available")
  }

  let sendAmount = input.sendAmount
  let receiveAmount = input.receiveAmount
  const rate = Number(rateData.rate)
  if (!rate || rate <= 0) {
    throw new SendQuoteError(SEND_QUOTE_ERROR_CODE.RATE_UNAVAILABLE, "Invalid exchange rate")
  }

  const receiveLed = !(sendAmount != null && sendAmount > 0) && receiveAmount != null && receiveAmount > 0
  if (sendAmount != null && sendAmount > 0) {
    receiveAmount = roundMoney(sendAmount * rate)
  } else if (receiveAmount != null && receiveAmount > 0) {
    sendAmount = roundMoney(receiveAmount / rate)
  } else {
    throw new Error("Send or receive amount is required")
  }

  if (!sendAmount || !receiveAmount) throw new Error("Invalid amounts")

  const corridorReceiveAmount = receiveAmount
  let receiveCappedByLeg2 = false

  for (let attempt = 0; attempt < 3; attempt++) {
    if (sendCurrency === "RUB" && sendAmount < MIN_RUB_SEND_AMOUNT) {
      throw new SendQuoteError(
        SEND_QUOTE_ERROR_CODE.MIN_SEND_AMOUNT,
        `Minimum send amount is ${MIN_RUB_SEND_AMOUNT} RUB`,
      )
    }

    let feeAmount = 0
    const feeType = rateData.fee_type || "free"
    if (feeType === "fixed") feeAmount = Number(rateData.fee_amount) || 0
    else if (feeType === "percentage") feeAmount = (sendAmount * (Number(rateData.fee_amount) || 0)) / 100

    const fulfillmentCheck = resolveFulfillment(receiveAmount, rateData)
    const fulfillment =
      fulfillmentCheck.ok &&
      fulfillmentCheck.fulfillment === "cash_hand" &&
      input.fulfillmentType === "cash_hand"
        ? "cash_hand"
        : "bank_transfer"

    if (!input.skipRecipientCheck && fulfillment === "bank_transfer" && !input.recipientId) {
      throw new Error("Recipient is required")
    }

    const logisticsFeeAmount =
      fulfillment === "cash_hand" ? computeLogisticsFee(receiveAmount, fulfillment, rateData) : 0

    const invoiceBaseB = roundMoney(sendAmount + feeAmount + logisticsFeeAmount)

    const prediction = await exchangePrediction({ volume: invoiceBaseB })
    const grossG = numField(prediction.volume_give_prediction)
    const usdtU = numField(prediction.volume_take_final)
    if (grossG == null || usdtU == null) {
      throw new SendQuoteError(SEND_QUOTE_ERROR_CODE.PREDICTION_UNAVAILABLE, "Bitbanker prediction unavailable")
    }

    const paymentProcessingFee = roundMoney(Math.max(0, grossG - invoiceBaseB))
    const totalAmount = roundMoney(grossG)

    const usdToLocalRow =
      receiveCurrency === "USD" ? { rate: 1 } : await currencyService.getRate("USD", receiveCurrency)
    const { desk: usdtDesk, source: usdtDeskSource } = resolveUsdtDeskRate(
      receiveCurrency,
      usdToLocalRow ? Number(usdToLocalRow.rate) : null,
    )

    if (usdtDesk == null) {
      throw new SendQuoteError(
        SEND_QUOTE_ERROR_CODE.DESK_RATE_NOT_CONFIGURED,
        `USD to ${receiveCurrency} exchange rate is not configured`,
      )
    }

    const maxLocal = maxLocalPayoutFromUsdt(usdtU, usdtDesk)
    if (maxLocal <= 0) {
      throw new SendQuoteError(
        SEND_QUOTE_ERROR_CODE.MIN_CONTRIBUTION,
        "Quote does not meet minimum contribution for this corridor",
      )
    }

    if (receiveAmount > maxLocal + 0.01) {
      receiveCappedByLeg2 = true
      if (receiveLed && corridorReceiveAmount > maxLocal + 0.01) {
        const scale = corridorReceiveAmount / maxLocal
        sendAmount = roundMoney(Math.max(sendAmount * scale * 1.01, sendAmount + 1))
        receiveAmount = roundMoney(sendAmount * rate)
        continue
      }
      receiveAmount = maxLocal
    }

    const leg2UsdtNeeded = usdtForLocalPayout(receiveAmount, usdtDesk)
    const leg2: RubLocalSendLegSnapshot = {
      sendAmountRub: sendAmount,
      corridorReceiveLocal: corridorReceiveAmount,
      receiveAmountLocal: receiveAmount,
      receiveCurrency,
      receiveCappedByLeg2,
      invoiceBaseB,
      sbpGrossG: grossG,
      usdtFromBitbanker: usdtU,
      usdtForLocalPayout: leg2UsdtNeeded,
      usdtDeskLocalPerUnit: usdtDesk,
      usdtDeskSource,
    }

    if (!input.skipMinContributionCheck && leg2UsdtNeeded != null) {
      assertLeg2UsdtCoverage({
        usdtFromBitbanker: usdtU,
        usdtForLocalPayout: leg2UsdtNeeded,
      })
    }

    const effectiveRate = sendAmount > 0 ? roundMoney(receiveAmount / sendAmount) : rate

    return {
      sendAmount,
      receiveAmount,
      sendCurrency,
      receiveCurrency,
      exchangeRate: effectiveRate,
      feeAmount: roundMoney(feeAmount),
      feeType,
      logisticsFeeAmount: roundMoney(logisticsFeeAmount),
      paymentProcessingFee,
      totalAmount,
      invoiceBaseB,
      predictedGrossG: grossG,
      predictedUsdtU: usdtU,
      fulfillment,
      quoteSnapshot: { prediction, leg2 },
    }
  }

  throw new SendQuoteError(
    SEND_QUOTE_ERROR_CODE.MIN_CONTRIBUTION,
    "Quote does not meet minimum contribution for this corridor",
  )
}

export async function previewSendQuote(input: CreateSendQuoteInput) {
  return computeSendQuoteBreakdown({
    ...input,
    skipRecipientCheck: true,
    skipMinContributionCheck: true,
  })
}

export async function createSendQuote(admin: SupabaseClient, input: CreateSendQuoteInput) {
  const breakdown = await computeSendQuoteBreakdown(input)
  const expiresAt = new Date(Date.now() + QUOTE_TTL_MS).toISOString()

  const { data: quote, error } = await admin
    .from("send_quotes")
    .insert({
      user_id: input.userId,
      status: "open",
      send_amount: breakdown.sendAmount,
      send_currency: breakdown.sendCurrency,
      receive_amount: breakdown.receiveAmount,
      receive_currency: breakdown.receiveCurrency,
      exchange_rate: breakdown.exchangeRate,
      fee_amount: breakdown.feeAmount,
      fee_type: breakdown.feeType,
      logistics_fee_amount: breakdown.logisticsFeeAmount,
      payment_processing_fee: breakdown.paymentProcessingFee,
      total_amount: breakdown.totalAmount,
      invoice_base_b: breakdown.invoiceBaseB,
      predicted_gross_g: breakdown.predictedGrossG,
      predicted_usdt_u: breakdown.predictedUsdtU,
      recipient_id: breakdown.fulfillment === "cash_hand" ? null : input.recipientId ?? null,
      fulfillment_type: breakdown.fulfillment,
      delivery_address_line: input.deliveryAddressLine ?? null,
      delivery_phone: input.deliveryPhone ?? null,
      delivery_address_id: input.deliveryAddressId ?? null,
      payment_method_intent: "bitbanker",
      quote_snapshot: breakdown.quoteSnapshot,
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
