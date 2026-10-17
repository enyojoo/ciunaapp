import { adminRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"

export const dynamic = "force-dynamic"

export const GET = adminRoute("settings.manage", async () => {
  const { data, error } = await createServerClient().from("send_limits").select("level,currency,monthly_amount,min_per_transfer,max_per_transfer,updated_at").order("level")
  check(error)
  return { limits: data || [] }
})

/** Replace the limit for one level: { level, currency, monthlyAmount, minPerTransfer?, maxPerTransfer? }, or { level, remove: true }. */
export const PUT = adminRoute("settings.manage", async (req, admin) => {
  const b = await readJson(req)
  const level = Number(b.level)
  assert(Number.isInteger(level) && level >= 1 && level <= 3, "LIMIT_LEVEL_INVALID")
  const db = createServerClient()
  if (b.remove === true) {
    check((await db.from("send_limits").delete().eq("level", level)).error)
    await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, action: "send_limit.removed", entityType: "send_limit", entityId: String(level) })
    return { ok: true }
  }
  const currency = String(b.currency || "").toUpperCase()
  const monthly = Number(b.monthlyAmount)
  const min = b.minPerTransfer == null || b.minPerTransfer === "" ? null : Number(b.minPerTransfer)
  const max = b.maxPerTransfer == null || b.maxPerTransfer === "" ? null : Number(b.maxPerTransfer)
  assert(/^[A-Z]{3}$/.test(currency), "LIMIT_CURRENCY_INVALID")
  assert(Number.isFinite(monthly) && monthly > 0 && monthly < 1e12, "LIMIT_AMOUNT_INVALID")
  assert(min == null || (Number.isFinite(min) && min >= 0), "LIMIT_AMOUNT_INVALID")
  assert(max == null || (Number.isFinite(max) && max > 0 && (min == null || max >= min)), "LIMIT_AMOUNT_INVALID")
  const row = { level, currency, monthly_amount: monthly, min_per_transfer: min, max_per_transfer: max, updated_by: admin.id, updated_at: new Date().toISOString() }
  check((await db.from("send_limits").upsert(row, { onConflict: "level" })).error)
  await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, action: "send_limit.set", entityType: "send_limit", entityId: String(level), details: { currency, monthly, min, max } })
  return { ok: true }
})
