import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, type AdminUser } from "@/lib/admin-auth-utils"
import { requireAuth, type AuthenticatedUser } from "@/lib/auth-utils"
import { MerchantError } from "./errors"
import { requireMerchant, type MerchantContext } from "./auth"
import type { MerchantPermission } from "./permissions"
import { adminCan, type AdminPermission } from "@/lib/admin-roles"

type Params = Record<string, string>

function handle(e: unknown) {
  if (e instanceof MerchantError) {
    return NextResponse.json({ error: e.code, errorCode: e.code, ...(e.details ? { details: e.details } : {}) }, { status: e.status })
  }
  const message = e instanceof Error ? e.message : ""
  if (message === "Authentication required" || message === "Admin access required") {
    return NextResponse.json({ error: message, errorCode: "UNAUTHENTICATED" }, { status: 401 })
  }
  if (message === "Account is suspended") return NextResponse.json({ error: message, errorCode: "SUSPENDED" }, { status: 403 })
  if (e instanceof SyntaxError) return NextResponse.json({ error: "INVALID_REQUEST", errorCode: "INVALID_REQUEST" }, { status: 400 })
  console.error("merchant route failed", e instanceof Error ? e.message : e)
  return NextResponse.json({ error: "UNAVAILABLE", errorCode: "UNAVAILABLE" }, { status: 503 })
}

type Ctx = { params?: Promise<Params> }

/** Signed-in customer account (e.g. creating a merchant, accepting an invite). */
export function authedRoute<T>(fn: (req: NextRequest, user: AuthenticatedUser, params: Params) => Promise<T>) {
  return async (request: NextRequest, context: Ctx = {}) => {
    try {
      const user = await requireAuth(request)
      const params = (await context.params) || {}
      return NextResponse.json(await fn(request, user, params))
    } catch (e) {
      return handle(e)
    }
  }
}

/** Acting merchant with a permission (membership checked on the server). */
export function merchantRoute<T>(
  permission: MerchantPermission | null,
  fn: (req: NextRequest, ctx: MerchantContext, params: Params) => Promise<T>,
  opts: { allowStatuses?: string[] } = {},
) {
  return async (request: NextRequest, context: Ctx = {}) => {
    try {
      const ctx = await requireMerchant(request, permission || undefined, opts)
      const params = (await context.params) || {}
      return NextResponse.json(await fn(request, ctx, params))
    } catch (e) {
      return handle(e)
    }
  }
}

/** Office staff with a permission. Legacy role "admin" is treated as ops. */
export function adminRoute<T>(permission: AdminPermission, fn: (req: NextRequest, admin: AdminUser, params: Params) => Promise<T>) {
  return async (request: NextRequest, context: Ctx = {}) => {
    try {
      const admin = await requireAdmin(request)
      if (!adminCan(admin.role, permission)) throw new MerchantError("FORBIDDEN", 403, { permission })
      const params = (await context.params) || {}
      return NextResponse.json(await fn(request, admin, params))
    } catch (e) {
      return handle(e)
    }
  }
}

export async function readJson(request: NextRequest): Promise<Record<string, any>> {
  const body = await request.json()
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new MerchantError("INVALID_REQUEST", 400)
  return body as Record<string, any>
}
