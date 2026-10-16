import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"

export const PATCH = merchantRoute("team", async (req, { user, merchant }, params) => {
  const body = await readJson(req)
  const role = String(body.role || "")
  assert(["manager", "staff", "finance"].includes(role), "ROLE_INVALID")
  assert(params.userId !== user.id, "CANNOT_CHANGE_SELF", 409)
  const db = createServerClient()
  const target = await db.from("merchant_members").select("role").eq("merchant_id", merchant.id).eq("user_id", params.userId).maybeSingle()
  check(target.error)
  assert(target.data, "MEMBER_NOT_FOUND", 404)
  assert(target.data.role !== "owner", "OWNER_IMMUTABLE", 409)
  const { error } = await db.from("merchant_members").update({ role }).eq("merchant_id", merchant.id).eq("user_id", params.userId)
  check(error)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "team.role_changed", entityType: "merchant_member", entityId: params.userId, details: { role } })
  return { ok: true }
})

export const DELETE = merchantRoute("team", async (_req, { user, merchant }, params) => {
  const db = createServerClient()
  const target = await db.from("merchant_members").select("role").eq("merchant_id", merchant.id).eq("user_id", params.userId).maybeSingle()
  check(target.error)
  assert(target.data, "MEMBER_NOT_FOUND", 404)
  assert(target.data.role !== "owner", "OWNER_IMMUTABLE", 409)
  const { error } = await db.from("merchant_members").delete().eq("merchant_id", merchant.id).eq("user_id", params.userId)
  check(error)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "team.removed", entityType: "merchant_member", entityId: params.userId })
  return { ok: true }
})
