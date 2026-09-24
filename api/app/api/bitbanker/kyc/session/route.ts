import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireUser, withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { isBitbankerConfigured } from "@/lib/bitbanker/config"
import {
  expireStaleKycSessions,
  getActiveKycSession,
  startHostedKycSession,
} from "@/lib/bitbanker/kyc-session-service"
import { getEligibilityForUser } from "@/lib/bitbanker/eligibility-service"

export const GET = withErrorHandling(async (request: NextRequest) => {
  const user = await requireUser(request)
  if (!isBitbankerConfigured()) {
    return createErrorResponse("Bitbanker integration is not configured", 503)
  }

  const admin = createServerClient()
  await expireStaleKycSessions(admin, user.id)

  const refresh = request.nextUrl.searchParams.get("refresh") === "1"
  const eligibility = await getEligibilityForUser(admin, user.id, { refresh })

  const session = await getActiveKycSession(admin, user.id)

  if (eligibility.isVerifiedForSbp) {
    await admin
      .from("bitbanker_kyc_sessions")
      .update({ bridge_status: "completed", updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("bridge_status", "active")
  }

  return NextResponse.json({
    eligibility: {
      status: eligibility.status,
      isVerifiedForSbp: eligibility.isVerifiedForSbp,
      clientId: eligibility.clientId,
    },
    session: session
      ? {
          sessionId: session.sessionId,
          kycUrl: session.kycUrl,
          paymentUrl: session.paymentUrl,
          provider: session.provider,
          expiresAt: session.expiresAt,
          status: session.status,
        }
      : null,
  })
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await requireUser(request)
  if (!isBitbankerConfigured()) {
    return createErrorResponse("Bitbanker integration is not configured", 503)
  }

  const admin = createServerClient()
  await expireStaleKycSessions(admin, user.id)

  const body = (await request.json().catch(() => ({}))) as { email?: string }
  const email = String(body.email || user.email || "").trim()
  if (!email) {
    return createErrorResponse("Email is required", 400)
  }

  try {
    const session = await startHostedKycSession(admin, user.id, email)
    return NextResponse.json({ session })
  } catch (e: unknown) {
    const err = e as Error & { code?: string; status?: number }
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502
    return createErrorResponse(err.message || "Failed to start verification", status, err.code)
  }
})
