import { NextRequest, NextResponse } from "next/server"
import { requireUser, withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { isBitbankerConfigured } from "@/lib/bitbanker/config"
import { previewSendQuote } from "@/lib/bitbanker/send-quote-service"
import { sendQuoteErrorResponse } from "@/lib/bitbanker/send-quote-errors"

/** Live Bitbanker fee breakdown for send UI (no persisted quote, no recipient required). */
export const POST = withErrorHandling(async (request: NextRequest) => {
  await requireUser(request)

  if (!isBitbankerConfigured()) {
    return createErrorResponse("Bitbanker is not configured", 503)
  }

  const body = await request.json()
  try {
    const breakdown = await previewSendQuote({
      userId: "",
      sendAmount: body.sendAmount != null ? Number(body.sendAmount) : undefined,
      receiveAmount: body.receiveAmount != null ? Number(body.receiveAmount) : undefined,
      sendCurrency: String(body.sendCurrency || ""),
      receiveCurrency: String(body.receiveCurrency || ""),
      fulfillmentType: "bank_transfer",
    })

    const leg2 = breakdown.quoteSnapshot.leg2
    return NextResponse.json({
      preview: {
        sendAmount: breakdown.sendAmount,
        sendCurrency: breakdown.sendCurrency,
        receiveAmount: breakdown.receiveAmount,
        receiveCurrency: breakdown.receiveCurrency,
        exchangeRate: breakdown.exchangeRate,
        feeAmount: breakdown.feeAmount,
        feeType: breakdown.feeType,
        paymentProcessingFee: breakdown.paymentProcessingFee,
        totalAmount: breakdown.totalAmount,
      },
      leg2: {
        usdtDeskConfigured: leg2?.usdtDeskLocalPerUnit != null,
        receiveCappedByLeg2: Boolean(leg2?.receiveCappedByLeg2),
        corridorReceiveAmount: leg2?.corridorReceiveLocal ?? breakdown.receiveAmount,
        usdtForLocalPayout: leg2?.usdtForLocalPayout ?? null,
        usdtFromBitbanker: leg2?.usdtFromBitbanker ?? breakdown.predictedUsdtU,
      },
    })
  } catch (e: unknown) {
    const { message, code, status } = sendQuoteErrorResponse(e)
    return createErrorResponse(message, status, code)
  }
})
