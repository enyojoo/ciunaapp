import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireUser, withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { requireBitbankerEligible } from "@/lib/bitbanker/eligibility-service"
import { createSendQuote } from "@/lib/bitbanker/send-quote-service"

export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await requireUser(request)
  const admin = createServerClient()

  try {
    await requireBitbankerEligible(admin, user.id)
  } catch (e: unknown) {
    const err = e as Error & { status?: number }
    return createErrorResponse(err.message || "Verification required", err.status ?? 403)
  }

  const body = await request.json()
  try {
    const quote = await createSendQuote(admin, {
      userId: user.id,
      sendAmount: body.sendAmount != null ? Number(body.sendAmount) : undefined,
      receiveAmount: body.receiveAmount != null ? Number(body.receiveAmount) : undefined,
      sendCurrency: String(body.sendCurrency || ""),
      receiveCurrency: String(body.receiveCurrency || ""),
      recipientId: body.recipientId ?? null,
      fulfillmentType: body.fulfillmentType === "cash_hand" ? "cash_hand" : "bank_transfer",
      deliveryAddressLine: body.deliveryAddressLine ?? null,
      deliveryPhone: body.deliveryPhone ?? null,
      deliveryAddressId: body.deliveryAddressId ?? null,
    })

    return NextResponse.json({
      quote: {
        id: quote.id,
        sendAmount: quote.send_amount,
        sendCurrency: quote.send_currency,
        receiveAmount: quote.receive_amount,
        receiveCurrency: quote.receive_currency,
        exchangeRate: quote.exchange_rate,
        feeAmount: quote.fee_amount,
        feeType: quote.fee_type,
        logisticsFeeAmount: quote.logistics_fee_amount,
        paymentProcessingFee: quote.payment_processing_fee,
        totalAmount: quote.total_amount,
        expiresAt: quote.expires_at,
      },
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to create quote"
    return createErrorResponse(message, 400)
  }
})
