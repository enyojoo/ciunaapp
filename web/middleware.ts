import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getPublicPlatformFlagsEdgeCached } from "@/lib/platform-settings-server"

const CONSUMER_APP_PREFIXES = [
  "/hub",
  "/send",
  "/transactions",
  "/assistant",
  "/recipients",
  "/more",
  "/support",
  "/food",
  "/mart",
  "/expert",
  "/experts",
] as const

function isConsumerSurface(pathname: string): boolean {
  if (pathname.startsWith("/auth/register")) return true
  return CONSUMER_APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function isMaintenanceAllowlisted(pathname: string): boolean {
  return (
    pathname === "/maintenance" ||
    pathname.startsWith("/auth/login") ||
    pathname.startsWith("/auth/forgot-password") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/auth/reset-password")
  )
}

function isApiOrStatic(pathname: string): boolean {
  return pathname.startsWith("/api/") || pathname.startsWith("/_next/")
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  let maintenanceMode = false
  let registrationEnabled = true
  try {
    const flags = await getPublicPlatformFlagsEdgeCached()
    maintenanceMode = flags.maintenanceMode
    registrationEnabled = flags.registrationEnabled
  } catch (e) {
    console.error("middleware platform flags:", e)
  }

  if (maintenanceMode && !isApiOrStatic(pathname) && !isMaintenanceAllowlisted(pathname) && isConsumerSurface(pathname)) {
    return NextResponse.redirect(new URL("/maintenance", request.url))
  }

  if (!registrationEnabled && pathname.startsWith("/auth/register")) {
    const u = new URL("/auth/login", request.url)
    u.searchParams.set("registration_disabled", "1")
    const refPreserve =
      request.nextUrl.searchParams.get("ref")?.trim() || request.nextUrl.searchParams.get("via")?.trim()
    if (refPreserve) u.searchParams.set("ref", refPreserve)
    return NextResponse.redirect(u)
  }

  const response = NextResponse.next()

  const refParam =
    request.nextUrl.searchParams.get("ref")?.trim() ||
    request.nextUrl.searchParams.get("via")?.trim()
  if (refParam && (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/register"))) {
    response.cookies.set("ciuna_ref_slug", refParam, {
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
  }

  if (pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
  }

  if (pathname.startsWith("/auth/")) {
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
  }

  if (CONSUMER_APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    response.headers.set("Cache-Control", "private, no-cache, must-revalidate")
  }

  return response
}

export const config = {
  matcher: [
    "/",
    "/maintenance",
    "/maintenance/:path*",
    "/api/:path*",
    "/auth/:path*",
    "/send/:path*",
    "/hub",
    "/hub/:path*",
    "/food",
    "/food/:path*",
    "/mart",
    "/mart/:path*",
    "/expert",
    "/expert/:path*",
    "/experts",
    "/experts/:path*",
    "/transactions",
    "/transactions/:path*",
    "/assistant",
    "/assistant/:path*",
    "/recipients/:path*",
    "/more/:path*",
    "/support/:path*",
  ],
}
