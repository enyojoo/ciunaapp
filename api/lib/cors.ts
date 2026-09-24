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
      "https://app.ciuna.com",
      "https://ciunaapp.vercel.app",
      "https://ciunaoffice.vercel.app",
      LOCAL_URLS.web,
      LOCAL_URLS.office,
      LOCAL_URLS.expo,
      ...extraOriginsFromEnv(),
    ]),
  )
}

const EXPO_DEV_PORTS = new Set(["8081", "19000", "19006", "8082"])

function isPrivateDevHost(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1") return true
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true
  return /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)
}

function isLocalExpoOrigin(origin: string): boolean {
  if (origin.startsWith("exp://")) return true
  try {
    const u = new URL(origin)
    if (u.protocol !== "http:" && u.protocol !== "https:") return false
    if (!isPrivateDevHost(u.hostname)) return false
    const port = u.port || (u.protocol === "https:" ? "443" : "80")
    return EXPO_DEV_PORTS.has(port)
  } catch {
    return false
  }
}

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins().includes(origin)) return true
  if (isLocalExpoOrigin(origin)) return true
  try {
    const { protocol, hostname } = new URL(origin)
    if (protocol !== "https:") return false
    if (hostname === "ciunaapp.vercel.app" || hostname === "ciunaoffice.vercel.app") return true
    return (
      hostname.endsWith(".vercel.app") &&
      (hostname.startsWith("ciunaapp-") || hostname.startsWith("ciunaoffice-"))
    )
  } catch {
    return false
  }
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
  if (origin && isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin
  }
  return headers
}
