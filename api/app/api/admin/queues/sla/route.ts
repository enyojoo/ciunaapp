import { adminRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"
import { loadSla } from "@/lib/merchant/office-data"
import { validateSlaUpdate } from "@/lib/merchant/office"

export const dynamic = "force-dynamic"

export const GET = adminRoute("merchants.read", async () => ({ sla: await loadSla() }))

/** Super admin changes SLA targets (hours; KYC and support are business hours / days). */
export const PUT = adminRoute("settings.manage", async (req, admin) => {
  const v = validateSlaUpdate(await readJson(req))
  assert(v.ok, v.ok ? "" : v.code)
  const db = createServerClient()
  const before = await loadSla(db)
  const next = { ...before, ...v.value }
  assert(next.business_end_hour > next.business_start_hour, "SLA_INVALID")
  const { error } = await db.from("marketplace_settings").upsert({ key: "office_sla", value: next, updated_at: new Date().toISOString() })
  check(error)
  await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, action: "office_sla.updated", entityType: "marketplace_settings", entityId: "office_sla", details: { before, after: next } })
  return { sla: next }
})
