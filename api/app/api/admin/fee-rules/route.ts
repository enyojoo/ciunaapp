import { adminRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"

export const GET = adminRoute("fees.manage", async (req) => {
  const kind = new URL(req.url).searchParams.get("kind")
  let q = createServerClient().from("fee_rules").select("*, merchants(display_name)").order("scope").order("created_at", { ascending: false })
  if (kind) q = q.eq("kind", kind)
  const { data, error } = await q
  check(error)
  return { rules: data || [] }
})

const num = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v))

/** Create or update a rule. The database checks that scope and keys agree; we translate the common mistakes. */
export const PUT = adminRoute("fees.manage", async (req, admin) => {
  const b = await readJson(req)
  assert(["commission", "payout"].includes(b.kind), "KIND_INVALID")
  assert(["platform", "service_line", "category", "merchant"].includes(b.scope), "SCOPE_INVALID")
  const row: Record<string, any> = {
    kind: b.kind, scope: b.scope,
    service_line: b.scope === "platform" || b.scope === "merchant" ? null : b.service_line || null,
    category: b.scope === "category" ? b.category || null : null,
    merchant_id: b.scope === "merchant" ? b.merchant_id || null : null,
    percent: num(b.percent), fixed_amount: num(b.fixed_amount), currency: b.currency ? String(b.currency).toUpperCase() : null,
    min_fee: num(b.min_fee), max_fee: num(b.max_fee), waive_above: num(b.waive_above),
    active: b.active !== false, starts_at: b.starts_at || null, ends_at: b.ends_at || null, note: b.note ? String(b.note).slice(0, 300) : null,
  }
  assert(row.percent !== null || row.fixed_amount !== null, "FEE_VALUE_REQUIRED")
  if (row.scope === "service_line" || row.scope === "category") assert(row.service_line, "SERVICE_LINE_REQUIRED")
  if (row.scope === "category") assert(row.category, "CATEGORY_REQUIRED")
  if (row.scope === "merchant") assert(row.merchant_id, "MERCHANT_REQUIRED")
  if (row.fixed_amount !== null) assert(row.currency, "CURRENCY_REQUIRED")
  const db = createServerClient()
  const res = b.id ? await db.from("fee_rules").update(row).eq("id", b.id).select("*").single() : await db.from("fee_rules").insert({ ...row, created_by: admin.id }).select("*").single()
  if (res.error?.code === "23514") assert(false, "FEE_RULE_INVALID")
  check(res.error)
  await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, merchantId: row.merchant_id, action: b.id ? "fee_rule.updated" : "fee_rule.created", entityType: "fee_rule", entityId: res.data!.id, details: row })
  return { rule: res.data }
})
