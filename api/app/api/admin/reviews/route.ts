import { adminRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { check } from "@/lib/merchant/errors"
import { nameWithInitial, parsePaging } from "@/lib/merchant/reviews"

export const dynamic = "force-dynamic"

/** Office list. ?status=published|hidden&rating=1..5&q=merchant name&limit&offset */
export const GET = adminRoute("merchants.read", async (req) => {
  const sp = new URL(req.url).searchParams
  const { limit, offset } = parsePaging(sp, 100, 50)
  const text = (sp.get("q") || "").trim().replace(/[%,()]/g, "")
  const merchantJoin = text ? "merchants!inner(display_name,type,slug)" : "merchants(display_name,type,slug)"
  let q = createServerClient()
    .from("reviews")
    .select(`id,order_id,merchant_id,target_type,rating,body,language,status,hidden_reason,reply,reply_at,created_at,users(first_name,last_name),${merchantJoin}`, { count: "exact" })
  const status = sp.get("status")
  if (status === "published" || status === "hidden") q = q.eq("status", status)
  const rating = Number(sp.get("rating"))
  if (Number.isInteger(rating) && rating >= 1 && rating <= 5) q = q.eq("rating", rating)
  if (text) q = q.ilike("merchants.display_name", `%${text}%`)
  const { data, error, count } = await q.order("created_at", { ascending: false }).range(offset, offset + limit - 1)
  check(error)
  const first = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v)
  return {
    reviews: (data || []).map((r: any) => {
      const { users, merchants, ...rest } = r
      const u = first<any>(users)
      const m = first<any>(merchants)
      return { ...rest, has_reply: Boolean(r.reply), customer: nameWithInitial(u?.first_name, u?.last_name), merchant: m ? { name: m.display_name, type: m.type, slug: m.slug } : null }
    }),
    total: count ?? 0,
  }
})
