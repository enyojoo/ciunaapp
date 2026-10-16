import { authedRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"

/** The invited person must be signed in with the invited email. */
export const POST = authedRoute(async (req, user) => {
  const body = await readJson(req)
  const token = String(body.token || "")
  assert(/^[0-9a-f-]{36}$/i.test(token), "INVITE_INVALID")
  const db = createServerClient()
  const { data: invite, error } = await db.from("merchant_invites").select("*").eq("token", token).maybeSingle()
  check(error)
  assert(invite && !invite.accepted_at && new Date(invite.expires_at) > new Date(), "INVITE_INVALID", 404)
  assert(String(invite.email).toLowerCase() === user.email.toLowerCase(), "INVITE_EMAIL_MISMATCH", 403)
  const ins = await db.from("merchant_members").insert({ merchant_id: invite.merchant_id, user_id: user.id, role: invite.role })
  if (ins.error?.code !== "23505") check(ins.error)
  const upd = await db.from("merchant_invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id)
  check(upd.error)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: invite.merchant_id, action: "team.joined", entityType: "merchant_member", entityId: user.id, details: { role: invite.role } })
  return { merchantId: invite.merchant_id }
})
