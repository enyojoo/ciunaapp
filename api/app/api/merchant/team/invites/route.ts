import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"

export const POST = merchantRoute("team", async (req, { user, merchant }) => {
  const body = await readJson(req)
  const email = String(body.email || "").trim().toLowerCase()
  const role = String(body.role || "")
  assert(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email), "EMAIL_INVALID")
  assert(["manager", "staff", "finance"].includes(role), "ROLE_INVALID")
  const db = createServerClient()
  const open = await db.from("merchant_invites").select("id", { count: "exact", head: true }).eq("merchant_id", merchant.id).is("accepted_at", null).gt("expires_at", new Date().toISOString())
  assert((open.count ?? 0) < 20, "TOO_MANY_INVITES", 409)
  const { data, error } = await db.from("merchant_invites").insert({ merchant_id: merchant.id, email, role, invited_by: user.id }).select("id, email, role, token, expires_at").single()
  check(error)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "team.invited", entityType: "merchant_invite", entityId: data!.id, details: { role } })
  return { invite: data }
})
