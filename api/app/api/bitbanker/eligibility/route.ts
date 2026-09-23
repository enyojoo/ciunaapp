import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireUser, withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { getEligibilityForUser } from "@/lib/bitbanker/eligibility-service"
import { isBitbankerConfigured } from "@/lib/bitbanker/config"

export const GET = withErrorHandling(async (request: NextRequest) => {
  const user = await requireUser(request)
  if (!isBitbankerConfigured()) {
    return createErrorResponse("Bitbanker integration is not configured", 503)
  }

  const refresh = request.nextUrl.searchParams.get("refresh") === "1"
  const admin = createServerClient()
  const result = await getEligibilityForUser(admin, user.id, { refresh })

  return NextResponse.json({
    status: result.status,
    isVerifiedForSbp: result.isVerifiedForSbp,
    clientId: result.clientId,
  })
})
