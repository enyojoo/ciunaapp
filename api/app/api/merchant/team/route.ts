import { merchantRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { check } from "@/lib/merchant/errors"

export const GET = merchantRoute("team", async (_req, { merchant }) => {
  const db = createServerClient()
  const [members, invites] = await Promise.all([
    db.from("merchant_members").select("user_id, role, created_at, users(email, first_name, last_name)").eq("merchant_id", merchant.id).order("created_at"),
    db.from("merchant_invites").select("id, email, role, expires_at, created_at").eq("merchant_id", merchant.id).is("accepted_at", null).gt("expires_at", new Date().toISOString()),
  ])
  check(members.error)
  check(invites.error)
  return { members: members.data || [], invites: invites.data || [] }
})
