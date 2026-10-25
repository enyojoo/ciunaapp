import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getCorsHeaders } from "@/lib/cors"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!pathname.startsWith("/api/") && pathname !== "/health") {
    return NextResponse.next()
  }

  const corsHeaders = getCorsHeaders(request)
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders })
  }

  // Every API response carries a request id so a customer report, a log line and an error report can be matched.
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID()
  const forwarded = new Headers(request.headers)
  forwarded.set("x-request-id", requestId)
  const response = NextResponse.next({ request: { headers: forwarded } })
  response.headers.set("x-request-id", requestId)
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
  return response
}

export const config = {
  matcher: ["/health", "/api/:path*"],
}
