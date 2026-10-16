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
} as const
