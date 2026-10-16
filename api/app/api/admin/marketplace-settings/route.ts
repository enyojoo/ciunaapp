import { adminRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"

export const GET = adminRoute("fees.manage", async () => {
  const { data, error } = await createServerClient().from("marketplace_settings").select("*")
  check(error)
  return { settings: Object.fromEntries((data || []).map((r: any) => [r.key, r.value])) }
})

export const PUT = adminRoute("fees.manage", async (req, admin) => {
  const b = await readJson(req)
  const updates: Array<{ key: string; value: unknown }> = []
  if ("payout_hold_days" in b) {
    const d = Number(b.payout_hold_days)
    assert(Number.isInteger(d) && d >= 0 && d <= 60, "HOLD_DAYS_INVALID")
    updates.push({ key: "payout_hold_days", value: d })
  }
  if ("min_payout" in b) {
    const m = b.min_payout
    assert(m && typeof m === "object" && Object.entries(m).every(([c, v]) => /^[A-Z]{3}$/.test(c) && Number.isFinite(Number(v)) && Number(v) >= 0), "MIN_PAYOUT_INVALID")
    updates.push({ key: "min_payout", value: Object.fromEntries(Object.entries(m).map(([c, v]) => [c, Number(v)])) })
  }
  assert(updates.length > 0, "NOTHING_TO_UPDATE")
  const { error } = await createServerClient().from("marketplace_settings").upsert(updates.map((u) => ({ ...u, updated_at: new Date().toISOString() })))
  check(error)
  await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, action: "marketplace_settings.updated", entityType: "marketplace_settings", details: Object.fromEntries(updates.map((u) => [u.key, u.value])) })
  return { ok: true }
})
