import { APP_URLS, LOCAL_URLS } from "@ciuna/shared"
import { type NextRequest } from "next/server"

function extraOriginsFromEnv(): string[] {
  const named = [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_OFFICE_URL]
  const csv = (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  return [...named, ...csv].filter((v): v is string => Boolean(v))
}

function allowedOrigins(): string[] {
  return Array.from(
    new Set([
      APP_URLS.app,
      APP_URLS.office,
      "https://m.ciuna.com",
      "https://ciunaoffice.vercel.app",
      LOCAL_URLS.web,
      LOCAL_URLS.office,
      LOCAL_URLS.expo,
      ...extraOriginsFromEnv(),
    ]),
  )
}

/**
 * CORS for every /api/* call. Bearer-only — no credentials/cookies.
 * Unknown origins get no Allow-Origin (do not echo app.ciuna.com).
 */
export function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin") || ""
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Webhook-Secret, X-Internal-Secret",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  }
  if (origin && allowedOrigins().includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin
  }
  return headers
}
