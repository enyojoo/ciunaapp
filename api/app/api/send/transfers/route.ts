import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireUser, withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { requireBitbankerEligible } from "@/lib/bitbanker/eligibility-service"
import { BitbankerApiError, formatBitbankerApiError } from "@/lib/bitbanker/client"
import { acceptSendQuoteAndCreateInvoice } from "@/lib/bitbanker/send-transfer-service"

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
  const quoteId = String(body.quoteId || "").trim()
  const idempotencyKey = String(body.idempotencyKey || body.idempotency_key || "").trim()
  if (!quoteId || !idempotencyKey) {
    return createErrorResponse("quoteId and idempotencyKey are required", 400)
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
