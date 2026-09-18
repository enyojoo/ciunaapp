import { APP_URLS, LOCAL_URLS } from "@ciuna/shared"
import { type NextRequest } from "next/server"

function allowedOrigins(): string[] {
  const extra = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_OFFICE_URL,
  ].filter((v): v is string => Boolean(v))

  return Array.from(
    new Set([
      APP_URLS.app,
      APP_URLS.office,
      "https://m.ciuna.com",
      LOCAL_URLS.web,
      LOCAL_URLS.office,
      LOCAL_URLS.expo,
      ...extra,
    ]),
  )
}

/**
 * CORS for every /api/* call. Bearer-only — no credentials/cookies.
 */
export function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin") || ""
  const allowlist = allowedOrigins()
  const allowOrigin = allowlist.includes(origin) ? origin : allowlist[0]
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Webhook-Secret, X-Internal-Secret",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  }
}
