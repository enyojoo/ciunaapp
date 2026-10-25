import { limitOrResponse, LIMITS } from "@/lib/rate-limit"
import { NextRequest, NextResponse } from "next/server"
import { assertWithinLimits } from "@/lib/limits"
import { MerchantError } from "@/lib/merchant/errors"
import { createServerClient } from "@/lib/supabase"
import { requireUser, withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { requireBitbankerEligible } from "@/lib/bitbanker/eligibility-service"
import { BitbankerApiError, formatBitbankerApiError } from "@/lib/bitbanker/client"
import { acceptSendQuoteAndCreateInvoice } from "@/lib/bitbanker/send-transfer-service"

export const POST = withErrorHandling(async (request: NextRequest) => {
  const limited = await limitOrResponse(request, "checkout", LIMITS.checkout)
  if (limited) return limited
  const user = await requireUser(request)
  const admin = createServerClient()

  try {
    await requireBitbankerEligible(admin, user.id)
  } catch (e: unknown) {
    const err = e as Error & { status?: number }
    return createErrorResponse(err.message || "Verification required", err.status ?? 403)
  }

  const body = await request.json()
  const quoteId = String(body.quoteId || "").trim()
  const idempotencyKey = String(body.idempotencyKey || body.idempotency_key || "").trim()
  if (!quoteId || !idempotencyKey) {
    return createErrorResponse("quoteId and idempotencyKey are required", 400)
  }

  // Limits for the customer's verification level. A retry of an already accepted quote is not counted twice.
  const { data: quote } = await admin.from("send_quotes").select("send_amount,send_currency,status").eq("id", quoteId).eq("user_id", user.id).maybeSingle()
  if (quote && (quote as { status: string }).status === "open") {
    try {
      await assertWithinLimits(user.id, Number((quote as any).send_amount), String((quote as any).send_currency))
    } catch (e) {
      if (e instanceof MerchantError) return NextResponse.json({ error: e.code, errorCode: e.code, details: e.details }, { status: e.status })
      throw e
    }
  }

  try {
    const result = await acceptSendQuoteAndCreateInvoice(admin, {
      userId: user.id,
      quoteId,
      idempotencyKey,
    })
    return NextResponse.json({
      transaction: result.transaction,
      payment: result.payment,
      reused: result.reused,
    })
  } catch (e: unknown) {
    const message = formatBitbankerApiError(e)
    const status = e instanceof BitbankerApiError ? e.status : 400
    return createErrorResponse(message, status >= 400 && status < 600 ? status : 400)
  }
})
