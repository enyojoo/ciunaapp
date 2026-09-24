import { NextRequest, NextResponse } from "next/server"
import { requireUser, withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { isBitbankerConfigured } from "@/lib/bitbanker/config"
import { previewSendQuote } from "@/lib/bitbanker/send-quote-service"
import { sendQuoteErrorResponse } from "@/lib/bitbanker/send-quote-errors"
import { roundMoney } from "@/utils/currency"

const PREVIEW_CACHE_MS = 30_000
const previewCache = new Map<string, { expiresAt: number; preview: Record<string, unknown> }>()

function previewCacheKey(body: Record<string, unknown>): string {
  const sendCurrency = String(body.sendCurrency || "").trim().toUpperCase()
  const receiveCurrency = String(body.receiveCurrency || "").trim().toUpperCase()
  const sendPart =
    body.sendAmount != null && Number(body.sendAmount) > 0
      ? `s${roundMoney(Number(body.sendAmount))}`
      : ""
  const recvPart =
    body.receiveAmount != null && Number(body.receiveAmount) > 0
      ? `r${roundMoney(Number(body.receiveAmount))}`
      : ""
  return `${sendCurrency}:${receiveCurrency}:${sendPart}:${recvPart}`
}

/** Live Bitbanker fee breakdown for send UI (no persisted quote, no recipient required). */
export const POST = withErrorHandling(async (request: NextRequest) => {
  await requireUser(request)

  if (!isBitbankerConfigured()) {
    return createErrorResponse("Bitbanker is not configured", 503)
  }

  const body = (await request.json()) as Record<string, unknown>
  const cacheKey = previewCacheKey(body)
  const cached = previewCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ preview: cached.preview })
  }

  try {
    const breakdown = await previewSendQuote({
      userId: "",
      sendAmount: body.sendAmount != null ? Number(body.sendAmount) : undefined,
      receiveAmount: body.receiveAmount != null ? Number(body.receiveAmount) : undefined,
      sendCurrency: String(body.sendCurrency || ""),
      receiveCurrency: String(body.receiveCurrency || ""),
      fulfillmentType: "bank_transfer",
    })

    const preview = {
      sendAmount: breakdown.sendAmount,
      sendCurrency: breakdown.sendCurrency,
      receiveAmount: breakdown.receiveAmount,
      receiveCurrency: breakdown.receiveCurrency,
      exchangeRate: breakdown.exchangeRate,
      feeAmount: breakdown.feeAmount,
      feeType: breakdown.feeType,
      paymentProcessingFee: breakdown.paymentProcessingFee,
      totalAmount: breakdown.totalAmount,
    }
    previewCache.set(cacheKey, { expiresAt: Date.now() + PREVIEW_CACHE_MS, preview })
    return NextResponse.json({ preview })
  } catch (e: unknown) {
    const { message, code, status } = sendQuoteErrorResponse(e)
    return createErrorResponse(message, status, code)
  }
})
