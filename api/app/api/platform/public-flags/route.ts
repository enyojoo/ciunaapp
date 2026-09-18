import { NextResponse } from "next/server"
import { getCachedPublicPlatformFlags } from "@/lib/platform-settings-server"
import { isYooKassaConfigured } from "@/lib/yookassa"

export async function GET() {
  try {
    const flags = await getCachedPublicPlatformFlags()
    return NextResponse.json(flags, {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    })
  } catch (e) {
    console.error("GET /api/platform/public-flags:", e)
    return NextResponse.json(
      {
        maintenanceMode: false,
        registrationEnabled: true,
        emailVerificationRequired: true,
        yookassaEnabled: isYooKassaConfigured(),
      },
      { status: 200 },
    )
  }
}
