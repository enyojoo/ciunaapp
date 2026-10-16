import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { requireAdmin, AdminForbiddenError } from "@/lib/admin-auth-utils"
import { rateLimit } from "@/lib/rate-limit"
import { MarketplaceError } from "./service"
export function marketplaceRoute(
  fn: (request: NextRequest, context: any, user: any) => Promise<unknown>,
  admin = false,
  /** Per-user limit for this route, e.g. `{ name: "checkout", limit: 10, windowSeconds: 60 }`. */
  limit?: { name: string; limit: number; windowSeconds: number },
) {
  return async (request: NextRequest, context: any = {}) => {
    try {
      const user = admin ? await requireAdmin(request) : await requireAuth(request)
      if (limit && !(await rateLimit(`${limit.name}:${user.id}`, limit.limit, limit.windowSeconds)))
        return NextResponse.json({ error: "RATE_LIMITED", errorCode: "RATE_LIMITED" }, { status: 429, headers: { "Retry-After": String(limit.windowSeconds) } })
      const params = await context.params
      return NextResponse.json(await fn(request, { ...context, params }, user))
    } catch (e) {
      if (e instanceof AdminForbiddenError) return NextResponse.json({ error: "FORBIDDEN", errorCode: "FORBIDDEN" }, { status: 403 })
      if (e instanceof MarketplaceError)
        return NextResponse.json({ error: e.code, errorCode: e.code }, { status: e.status })
      const message = e instanceof Error ? e.message : ""
      if (message === "Authentication required" || message === "Admin access required")
        return NextResponse.json({ error: message }, { status: 401 })
      if (e instanceof SyntaxError)
        return NextResponse.json({ error: "INVALID_REQUEST", errorCode: "INVALID_REQUEST" }, { status: 400 })
      console.error("Marketplace request failed", e instanceof Error ? e.name : "unknown")
      return NextResponse.json(
        { error: "MARKETPLACE_UNAVAILABLE", errorCode: "MARKETPLACE_UNAVAILABLE" },
        { status: 503 },
      )
    }
  }
}
