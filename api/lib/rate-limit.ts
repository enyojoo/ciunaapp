import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

/** Fixed-window limiter backed by the `rate_limit_hit` SQL function. Fails open: a database error never blocks a request. */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  try {
    const { data, error } = await createServerClient().rpc("rate_limit_hit", { p_key: key, p_limit: limit, p_window_seconds: windowSeconds })
    if (error) return true
    return data !== false
  } catch {
    return true
  }
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
}

/** Starting limits from the decisions guide. Tune in one place. */
export const LIMITS = {
  search: { limit: 60, windowSeconds: 60 },
  auth: { limit: 10, windowSeconds: 60 },
  checkout: { limit: 10, windowSeconds: 60 },
  upload: { limit: 20, windowSeconds: 60 },
  cart: { limit: 60, windowSeconds: 60 },
  favourite: { limit: 60, windowSeconds: 60 },
  support: { limit: 20, windowSeconds: 60 },
  otp: { limit: 5, windowSeconds: 900 },
  message: { limit: 20, windowSeconds: 60 },
  quote: { limit: 10, windowSeconds: 60 },
  kyc: { limit: 10, windowSeconds: 3600 },
  assistant: { limit: 20, windowSeconds: 60 },
} as const

/**
 * Route guard: returns a 429 response with Retry-After when the caller is over the limit, otherwise null.
 * Keyed by user id when known, else by client IP. Use at the top of a handler.
 */
export async function limitOrResponse(
  request: Request,
  scope: string,
  cfg: { limit: number; windowSeconds: number },
  userId?: string | null,
): Promise<NextResponse | null> {
  const ok = await rateLimit(`${scope}:${userId || clientIp(request)}`, cfg.limit, cfg.windowSeconds)
  if (ok) return null
  return NextResponse.json(
    { error: "Too many requests. Try again shortly.", errorCode: "RATE_LIMITED" },
    { status: 429, headers: { "Retry-After": String(cfg.windowSeconds) } },
  )
}
