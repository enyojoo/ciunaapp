import { authedRoute } from "@/lib/merchant/http"
import { listMyMerchants } from "@/lib/merchant/auth"
import { createServerClient } from "@/lib/supabase"
import { check } from "@/lib/merchant/errors"
import { ROLE_PERMISSIONS } from "@/lib/merchant/permissions"

export const GET = authedRoute(async (_req, user) => {
  const mine = await listMyMerchants(user.id)
  const invites = await createServerClient()
    .from("merchant_invites")
    .select("id, role, token, expires_at, merchants(id, display_name, type)")
    .ilike("email", user.email)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
  check(invites.error)
  const ids = mine.map((m) => m.merchant.id)
  const vendors = ids.length ? await createServerClient().from("hub_vendors").select("merchant_id, service_line_slug").in("merchant_id", ids) : { data: [] as any[] }
  const line = new Map<string, string>((vendors.data || []).map((v: any) => [v.merchant_id, v.service_line_slug]))
  return {
    user: { id: user.id, email: user.email, name: [user.profile?.first_name, user.profile?.last_name].filter(Boolean).join(" ") || null },
    merchants: mine.map((m) => ({ ...m.merchant, service_line: line.get(m.merchant.id) ?? null, role: m.role, permissions: Array.from(ROLE_PERMISSIONS[m.role]) })),
    invites: invites.data || [],
  }
})
