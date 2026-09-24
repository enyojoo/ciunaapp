import { NextRequest } from "next/server"
import { requireUser, withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { isBitbankerConfigured } from "@/lib/bitbanker/config"

/** Retired: onboarding uses hosted KYC bridge (POST /api/bitbanker/kyc/session). */
export const POST = withErrorHandling(async (_request: NextRequest) => {
  await requireUser(_request)
  if (!isBitbankerConfigured()) {
    return createErrorResponse("Bitbanker integration is not configured", 503)
  }

  return createErrorResponse(
    "Passport form verification is retired. Use POST /api/bitbanker/kyc/session and the hosted Bitbanker flow.",
    410,
    "kyc_bridge_required",
  )
})
