import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getCorsHeaders } from "@/lib/cors"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!pathname.startsWith("/api/") && pathname !== "/health") {
    return NextResponse.next()
  }

  const corsHeaders = getCorsHeaders(request)
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders })
  }

  const response = NextResponse.next()
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
  return response
}

export const config = {
  matcher: ["/health", "/api/:path*"],
}
