import { adminRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { check } from "@/lib/merchant/errors"

export const dynamic = "force-dynamic"

export const GET = adminRoute("users.read", async () => {
  const db = createServerClient()
  const { data, error } = await db.from("account_deletions").select("user_id,status,reason,requested_at,purge_after,completed_at").eq("status", "requested").order("purge_after").limit(200)
  check(error)
  const rows = (data as any[]) || []
  const ids = rows.map((r) => r.user_id)
  const { data: users } = ids.length ? await db.from("users").select("id,email,first_name,last_name").in("id", ids) : { data: [] as any[] }
  const byId = new Map((users as any[] || []).map((u) => [u.id, u]))
  return { deletions: rows.map((r) => ({ ...r, customer: { email: byId.get(r.user_id)?.email ?? null, name: [byId.get(r.user_id)?.first_name, byId.get(r.user_id)?.last_name].filter(Boolean).join(" ") || null } })) }
})
