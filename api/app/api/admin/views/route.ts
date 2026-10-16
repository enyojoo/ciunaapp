import { adminRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { MerchantError, assert, check } from "@/lib/merchant/errors"
import { adminCan } from "@/lib/admin-roles"
import { MAX_VIEWS_PER_SCOPE, VIEW_SCOPES, VIEW_SCOPE_PERMISSION, isMissingSchema, validateView, type ViewScope } from "@/lib/merchant/office"

export const dynamic = "force-dynamic"

function needScope(role: string, scope: ViewScope) {
  if (!adminCan(role, VIEW_SCOPE_PERMISSION[scope])) throw new MerchantError("FORBIDDEN", 403, { permission: VIEW_SCOPE_PERMISSION[scope] })
}

/** My saved views for a screen: ?scope=merchants|payouts|audit|listings. `unavailable` until the Office queue SQL is applied. */
export const GET = adminRoute("merchants.read", async (req, admin) => {
  const scope = new URL(req.url).searchParams.get("scope") as ViewScope
  assert(VIEW_SCOPES.includes(scope), "VIEW_SCOPE_INVALID")
  needScope(admin.role, scope)
  const { data, error } = await createServerClient().from("office_saved_views").select("id,scope,name,filters,created_at").eq("user_id", admin.id).eq("scope", scope).order("created_at")
  if (error && isMissingSchema(error)) return { views: [], unavailable: true }
  check(error)
  return { views: data || [] }
})

/** Save the current filters under a name. Saving the same name again replaces its filters. */
export const POST = adminRoute("merchants.read", async (req, admin) => {
  const v = validateView(await readJson(req))
  needScope(admin.role, v.scope)
  const db = createServerClient()
  const existing = await db.from("office_saved_views").select("id,name").eq("user_id", admin.id).eq("scope", v.scope)
  if (existing.error && isMissingSchema(existing.error)) throw new MerchantError("VIEWS_NOT_AVAILABLE", 503)
  check(existing.error)
  const same = (existing.data || []).find((r: any) => r.name === v.name)
  assert(same || (existing.data || []).length < MAX_VIEWS_PER_SCOPE, "TOO_MANY_VIEWS", 409)
  const { data, error } = await db.from("office_saved_views").upsert({ user_id: admin.id, scope: v.scope, name: v.name, filters: v.filters }, { onConflict: "user_id,scope,name" }).select("id,scope,name,filters,created_at").single()
  check(error)
  return { view: data }
})
