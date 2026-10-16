import { adminRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { check } from "@/lib/merchant/errors"

export const GET = adminRoute("audit.read", async (req) => {
  const sp = new URL(req.url).searchParams
  let q = createServerClient().from("audit_log").select("*", { count: "exact" })
  for (const k of ["merchant_id", "entity_type", "entity_id", "action", "actor_id"]) {
    const v = sp.get(k)
    if (v) q = q.eq(k, v)
  }
  const limit = Math.min(Number(sp.get("limit")) || 50, 200)
  const offset = Math.max(Number(sp.get("offset")) || 0, 0)
  const { data, error, count } = await q.order("id", { ascending: false }).range(offset, offset + limit - 1)
  check(error)
  return { entries: data || [], total: count ?? 0 }
})
