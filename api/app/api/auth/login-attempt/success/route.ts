import { type NextRequest, NextResponse } from "next/server"
import { LoginAttemptService } from "@/lib/login-attempts"
import { getClientIp, getClientUserAgent } from "@/lib/request-client-meta"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === "string" ? body.email.trim() : ""
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const ipAddress = getClientIp(request)
    const userAgent = getClientUserAgent(request)
    await LoginAttemptService.recordAttempt(email, true, ipAddress, userAgent)
    await LoginAttemptService.clearFailedAttempts(email)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    console.error("login-attempt/success:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
