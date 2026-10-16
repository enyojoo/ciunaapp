import { adminRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { cleanSearch, isMissingSchema, slaCutoff } from "@/lib/merchant/office"
import { adminDirectory, listingView, loadSla, selectListings } from "@/lib/merchant/office-data"

export const dynamic = "force-dynamic"
const TABS = ["pending", "live", "rejected", "paused", "all"] as const
type Tab = (typeof TABS)[number]
const NO_ROWS = "00000000-0000-0000-0000-000000000000"

function byTab(q: any, tab: Tab) {
  if (tab === "pending") return q.eq("review_status", "pending").neq("status", "archived")
  if (tab === "live") return q.eq("review_status", "approved").eq("status", "live")
  if (tab === "rejected") return q.eq("review_status", "rejected").neq("status", "archived")
  if (tab === "paused") return q.eq("status", "paused")
  return q.neq("status", "archived")
}

/**
 * Listing review queue. ?tab=pending|live|rejected|paused|all (default pending) &mine=1 &over_sla=1 &q=title &line=food|mart
 * Pending is oldest first. Each row has `owner` and `sla`; `counts` gives the tab badges.
 */
export const GET = adminRoute("listings.review", async (req, admin) => {
  const sp = new URL(req.url).searchParams
  const tab = (sp.get("tab") || "pending") as Tab
  assert(TABS.includes(tab), "INVALID_REQUEST")
  const db = createServerClient()
  const sla = await loadSla(db)
  const text = cleanSearch(sp.get("q"))
  const line = sp.get("line")
  const mine = sp.get("mine") === "1"
  const overSla = sp.get("over_sla") === "1"
  const limit = Math.min(Number(sp.get("limit")) || 50, 200)
  const offset = Math.max(Number(sp.get("offset")) || 0, 0)
  const oldestFirst = tab === "pending" || mine || overSla

  const res = await selectListings(db, (select, queueCols) => {
    let q: any = byTab(db.from("hub_products").select(select, { count: "exact" }), mine || overSla ? "pending" : tab)
    if (text) q = q.ilike("title", `%${text}%`)
    if (line === "food" || line === "mart") q = q.eq("service_line_slug", line)
    if (queueCols) {
      if (mine) q = q.eq("review_assigned_to", admin.id)
      if (overSla) q = q.lt("review_requested_at", slaCutoff(sla.listing_review))
    } else {
      if (mine) q = q.eq("id", NO_ROWS)
      if (overSla) q = q.lt("updated_at", slaCutoff(sla.listing_review))
    }
    return q.order(queueCols ? "review_requested_at" : "updated_at", { ascending: oldestFirst, nullsFirst: false }).range(offset, offset + limit - 1)
  })
  check(res.error)
  const rows = (res.data || []) as any[]
  const queueCols = rows.length ? "review_assigned_to" in rows[0] : true
  const dir = await adminDirectory(db, rows.map((r) => r.review_assigned_to))
  const now = new Date()

  const counts: Record<string, number | null> = {}
  await Promise.all((["pending", "live", "rejected", "paused"] as Tab[]).map(async (t) => {
    const c = await byTab(db.from("hub_products").select("id", { count: "exact", head: true }), t)
    if (c.error && !isMissingSchema(c.error)) check(c.error)
    counts[t] = c.error ? null : c.count ?? 0
  }))
  return { listings: rows.map((r) => listingView(r, queueCols, sla, admin.id, dir, now)), total: res.count ?? 0, counts, sla: { listing_review: sla.listing_review } }
})
