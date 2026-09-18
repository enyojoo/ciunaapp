import { type NextRequest, NextResponse } from "next/server"
import { LoginAttemptService } from "@/lib/login-attempts"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === "string" ? body.email.trim() : ""
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const lockStatus = await LoginAttemptService.isAccountLocked(email)
    if (lockStatus.locked) {
      return NextResponse.json({
        locked: true,
        remainingMinutes: lockStatus.remainingTime,
      })
    }
    return NextResponse.json({ locked: false })
  } catch (e) {
    console.error("login-attempt/status:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
