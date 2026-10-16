import { adminRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { check } from "@/lib/merchant/errors"
import { parsePaging } from "@/lib/merchant/reviews"

export const dynamic = "force-dynamic"

/** Office queue. ?status=open|awaiting_customer|resolved&assigned=me|none&q=subject or reference&limit&offset */
export const GET = adminRoute("support.read", async (req, admin) => {
  const sp = new URL(req.url).searchParams
  const { limit, offset } = parsePaging(sp, 100, 50)
  let q = createServerClient()
    .from("support_requests")
    .select("id,public_id,topic,subject,status,order_id,assigned_to,agent_unread,last_message_at,last_message_preview,created_at,users!support_requests_user_id_fkey(first_name,last_name,email)", { count: "exact" })
  const status = sp.get("status")
  if (status === "open" || status === "awaiting_customer" || status === "resolved") q = q.eq("status", status)
  const assigned = sp.get("assigned")
  if (assigned === "me") q = q.eq("assigned_to", admin.id)
  if (assigned === "none") q = q.is("assigned_to", null)
  const text = (sp.get("q") || "").trim().replace(/[%,()]/g, "")
  if (text) q = q.or(`subject.ilike.%${text}%,public_id.ilike.%${text}%`)
  const { data, error, count } = await q.order("last_message_at", { ascending: false }).range(offset, offset + limit - 1)
  check(error)
  const first = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v)
  return {
    requests: (data || []).map((r: any) => {
      const { users, ...rest } = r
      const u = first<any>(users)
      return { ...rest, customer: { name: [u?.first_name, u?.last_name].filter(Boolean).join(" ") || null, email: u?.email ?? null } }
    }),
    total: count ?? 0,
  }
})
