import { adminRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"

export const GET = adminRoute("fees.manage", async () => {
  const { data, error } = await createServerClient().from("fee_plans").select("*").order("name")
  check(error)
  return { plans: data || [] }
})

export const PUT = adminRoute("fees.manage", async (req, admin) => {
  const b = await readJson(req)
  const name = String(b.name || "").trim().slice(0, 60)
  assert(name.length >= 2, "NAME_REQUIRED")
  const pct = b.commission_percent === null || b.commission_percent === "" || b.commission_percent === undefined ? null : Number(b.commission_percent)
  assert(pct === null || (Number.isFinite(pct) && pct >= 0 && pct <= 100), "PERCENT_INVALID")
  const fee = Number(b.monthly_fee ?? 0)
  assert(Number.isFinite(fee) && fee >= 0, "FEE_INVALID")
  const row = { name, monthly_fee: fee, currency: String(b.currency || "RUB").toUpperCase(), commission_percent: pct, perks: b.perks && typeof b.perks === "object" ? b.perks : {}, active: b.active !== false }
  const db = createServerClient()
  const res = b.id ? await db.from("fee_plans").update(row).eq("id", b.id).select("*").single() : await db.from("fee_plans").insert(row).select("*").single()
  if (res.error?.code === "23505") assert(false, "NAME_TAKEN", 409)
  check(res.error)
  await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, action: b.id ? "fee_plan.updated" : "fee_plan.created", entityType: "fee_plan", entityId: res.data!.id, details: row })
  return { plan: res.data }
})
