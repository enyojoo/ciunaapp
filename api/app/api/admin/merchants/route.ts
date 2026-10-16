import { adminRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { check } from "@/lib/merchant/errors"
import { isMissingSchema, slaCutoff } from "@/lib/merchant/office"
import { loadSla, withOwnerAndSla } from "@/lib/merchant/office-data"

const NO_ROWS = "00000000-0000-0000-0000-000000000000"

/**
 * Office list and review queue. ?status=in_review&type=store&q=name
 * `mine=1`: merchants whose open application I claimed. `over_sla=1`: in review past the application SLA.
 * Queue views (in review, mine, over SLA) are oldest first. Each row carries `owner` and `sla`.
 */
export const GET = adminRoute("merchants.read", async (req, admin) => {
  const sp = new URL(req.url).searchParams
  const db = createServerClient()
  const sla = await loadSla(db)
  let q = db.from("merchants").select("id,type,slug,display_name,country,operating_country,status,kyb_tier,office_managed,owner_team,submitted_at,approved_at,created_at", { count: "exact" })
  const status = sp.get("status")
  const type = sp.get("type")
  const text = (sp.get("q") || "").trim().replace(/[%,()]/g, "")
  const mine = sp.get("mine") === "1"
  const overSla = sp.get("over_sla") === "1"
  if (status) q = q.eq("status", status)
  if (overSla) q = q.eq("status", "in_review").lt("submitted_at", slaCutoff(sla.merchant_application))
  if (type) q = q.eq("type", type)
  if (text) q = q.ilike("display_name", `%${text}%`)
  if (mine) {
    const a = await db.from("merchant_applications").select("merchant_id").eq("assigned_to", admin.id).in("status", ["submitted", "in_review"])
    if (a.error && !isMissingSchema(a.error)) check(a.error)
    const ids = (a.data || []).map((r: any) => r.merchant_id)
    q = q.in("id", ids.length ? ids : [NO_ROWS])
  }
  const limit = Math.min(Number(sp.get("limit")) || 50, 200)
  const offset = Math.max(Number(sp.get("offset")) || 0, 0)
  const oldestFirst = status === "in_review" || overSla || mine
  const { data, error, count } = await q.order(oldestFirst ? "submitted_at" : "created_at", { ascending: oldestFirst }).range(offset, offset + limit - 1)
  check(error)
  return { merchants: await withOwnerAndSla(db, (data || []) as any[], sla, admin.id), total: count ?? 0, sla: { merchant_application: sla.merchant_application } }
})
