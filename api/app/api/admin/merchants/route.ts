import { adminRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { check } from "@/lib/merchant/errors"

/** Office list and review queue. ?status=in_review&type=store&q=name */
export const GET = adminRoute("merchants.read", async (req) => {
  const sp = new URL(req.url).searchParams
  let q = createServerClient().from("merchants").select("id,type,slug,display_name,country,operating_country,status,kyb_tier,office_managed,submitted_at,approved_at,created_at", { count: "exact" })
  const status = sp.get("status")
  const type = sp.get("type")
  const text = (sp.get("q") || "").trim().replace(/[%,()]/g, "")
  if (status) q = q.eq("status", status)
  if (type) q = q.eq("type", type)
  if (text) q = q.ilike("display_name", `%${text}%`)
  const limit = Math.min(Number(sp.get("limit")) || 50, 200)
  const offset = Math.max(Number(sp.get("offset")) || 0, 0)
  const { data, error, count } = await q.order(status === "in_review" ? "submitted_at" : "created_at", { ascending: status === "in_review" }).range(offset, offset + limit - 1)
  check(error)
  return { merchants: data || [], total: count ?? 0 }
})
