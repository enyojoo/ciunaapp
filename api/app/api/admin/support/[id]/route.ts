import { adminRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check, MerchantError } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"
import { mapSupportError, markRead } from "@/lib/support"

export const dynamic = "force-dynamic"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** One request with its thread and the customer's details. Opening it clears the staff unread count. */
export const GET = adminRoute("support.read", async (_req, _admin, params) => {
  const id = String(params.id)
  assert(UUID.test(id), "SUPPORT_NOT_FOUND", 404)
  const db = createServerClient()
  const { data: request, error } = await db
    .from("support_requests")
    .select("id,public_id,topic,subject,status,order_id,assigned_to,agent_unread,created_at,resolved_at,users!support_requests_user_id_fkey(first_name,last_name,email)")
    .eq("id", id)
    .maybeSingle()
  check(error)
  if (!request) throw new MerchantError("SUPPORT_NOT_FOUND", 404)
  const { data: messages, error: mErr } = await db.from("support_messages").select("id,sender_kind,sender_id,body,created_at").eq("request_id", id).order("id", { ascending: true }).limit(500)
  check(mErr)
  await markRead(id, "agent")
  const { users, ...rest } = request as any
  const u = Array.isArray(users) ? users[0] : users
  return { request: { ...rest, customer: { name: [u?.first_name, u?.last_name].filter(Boolean).join(" ") || null, email: u?.email ?? null } }, messages: messages || [] }
})

/** { assignTo: "me" | null } assigns or clears the assignee; { status: "resolved" } resolves with a system line. */
export const PATCH = adminRoute("support.manage", async (req, admin, params) => {
  const id = String(params.id)
  assert(UUID.test(id), "SUPPORT_NOT_FOUND", 404)
  const body = await readJson(req)
  const db = createServerClient()
  if ("assignTo" in body) {
    const { error } = await db.from("support_requests").update({ assigned_to: body.assignTo === "me" ? admin.id : null, updated_at: new Date().toISOString() }).eq("id", id)
    check(error)
    await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, action: "support.assigned", entityType: "support_request", entityId: id, details: { to: body.assignTo === "me" ? admin.id : null } })
  }
  if (body.status === "resolved") {
    const { error } = await db.rpc("support_resolve", { p_request: id, p_agent: admin.id })
    if (error) mapSupportError(error)
    await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, action: "support.resolved", entityType: "support_request", entityId: id })
  }
  return { ok: true }
})
