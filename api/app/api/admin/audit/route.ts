import { adminRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { check } from "@/lib/merchant/errors"
import type { AuditRow } from "@/lib/merchant/office"
import { auditQuery, enrichAudit } from "@/lib/merchant/office-data"

export const dynamic = "force-dynamic"

/**
 * Audit log, newest first. Filters: merchant_id, entity_type, entity_id, action, actor_id, actor_kind, from, to (dates, inclusive).
 * Each entry carries `actor_name`, `actor_email` and `merchant_name`.
 */
export const GET = adminRoute("audit.read", async (req) => {
  const sp = new URL(req.url).searchParams
  const db = createServerClient()
  const limit = Math.min(Number(sp.get("limit")) || 50, 200)
  const offset = Math.max(Number(sp.get("offset")) || 0, 0)
  const { data, error, count } = await auditQuery(db, sp, { count: true }).range(offset, offset + limit - 1)
  check(error)
  return { entries: await enrichAudit(db, (data || []) as AuditRow[]), total: count ?? 0 }
})
