import { adminRawRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { check } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"
import { AUDIT_EXPORT_MAX, auditCsv, type AuditRow } from "@/lib/merchant/office"
import { auditQuery, enrichAudit } from "@/lib/merchant/office-data"

export const dynamic = "force-dynamic"

/** CSV of the audit log with the same filters as the list (newest first, at most 5,000 rows). The export itself is audited. */
export const GET = adminRawRoute("audit.read", async (req, admin) => {
  const sp = new URL(req.url).searchParams
  const db = createServerClient()
  const { data, error } = await auditQuery(db, sp).limit(AUDIT_EXPORT_MAX)
  check(error)
  const rows = await enrichAudit(db, (data || []) as AuditRow[])
  const filters = Object.fromEntries(Array.from(sp.entries()).filter(([k]) => ["merchant_id", "entity_type", "entity_id", "action", "actor_id", "actor_kind", "from", "to"].includes(k)))
  await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, action: "audit.exported", entityType: "audit_log", details: { filters, rows: rows.length } })
  const stamp = new Date().toISOString().slice(0, 10)
  return new Response(auditCsv(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="audit-${stamp}.csv"`, "Cache-Control": "no-store", "X-Truncated": rows.length >= AUDIT_EXPORT_MAX ? "1" : "0" },
  })
})
