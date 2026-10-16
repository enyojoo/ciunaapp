import { limitOrResponse, LIMITS } from "@/lib/rate-limit"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { tableExists } from "@/lib/merchant/messages"
import { requireAuth, createErrorResponse, withErrorHandling } from "@/lib/auth-utils"

export const dynamic = "force-dynamic"
const TYPES = ["vendor", "expert", "product"]
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function who(request: NextRequest) {
  try {
    return await requireAuth(request)
  } catch {
    return null
  }
}

/** The caller's favourites, resolved to display rows, newest first. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const user = await who(request)
  if (!user) return createErrorResponse("Unauthorized", 401)
  if (!(await tableExists("favorites"))) {
    const res = NextResponse.json({ keys: [], vendors: [], experts: [], products: [], unavailable: true })
    res.headers.set("Cache-Control", "no-store")
    return res
  }
  const db = createServerClient()
  const { data, error } = await db.from("favorites").select("target_type,target_id,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200)
  if (error) return createErrorResponse("Failed to load favourites", 500)
  const ids = (t: string) => (data || []).filter((f) => f.target_type === t).map((f) => f.target_id)
  const [vendors, experts, products] = await Promise.all([
    ids("vendor").length ? db.from("hub_vendors").select("id,name,slug,photo_url,service_line_slug,is_verified,is_published").in("id", ids("vendor")) : { data: [] },
    ids("expert").length ? db.from("expert_profiles").select("id,slug,display_name,headline,image_url,is_published").in("id", ids("expert")) : { data: [] },
    ids("product").length ? db.from("hub_products").select("id,title,image_url,list_price,sale_price,fixed_amount,fixed_currency,service_line_slug,vendor_id,status,sold_out").in("id", ids("product")) : { data: [] },
  ])
  const res = NextResponse.json({
    keys: (data || []).map((f) => `${f.target_type}:${f.target_id}`),
    vendors: (vendors.data || []).filter((v: any) => v.is_published),
    experts: (experts.data || []).filter((e: any) => e.is_published),
    products: (products.data || []).filter((p: any) => p.status === "live"),
  })
  res.headers.set("Cache-Control", "no-store")
  return res
})

async function parse(request: NextRequest) {
  const b = await request.json().catch(() => null)
  const type = String(b?.type || ""), id = String(b?.id || "")
  return TYPES.includes(type) && UUID.test(id) ? { type, id } : null
}

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const limited = await limitOrResponse(request, "favourite", LIMITS.favourite)
  if (limited) return limited
  const user = await who(request)
  if (!user) return createErrorResponse("Unauthorized", 401)
  const t = await parse(request)
  if (!t) return createErrorResponse("Invalid favourite", 400)
  if (!(await tableExists("favorites"))) return createErrorResponse("Favourites are not available yet", 503)
  const db = createServerClient()
  const { count } = await db.from("favorites").select("target_id", { count: "exact", head: true }).eq("user_id", user.id)
  if ((count ?? 0) >= 500) return createErrorResponse("Too many favourites", 409)
  const { error } = await db.from("favorites").upsert({ user_id: user.id, target_type: t.type, target_id: t.id }, { onConflict: "user_id,target_type,target_id", ignoreDuplicates: true })
  if (error) return createErrorResponse("Failed to save", 500)
  return NextResponse.json({ ok: true })
})

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const limited = await limitOrResponse(request, "favourite", LIMITS.favourite)
  if (limited) return limited
  const user = await who(request)
  if (!user) return createErrorResponse("Unauthorized", 401)
  const t = await parse(request)
  if (!t) return createErrorResponse("Invalid favourite", 400)
  if (!(await tableExists("favorites"))) return createErrorResponse("Favourites are not available yet", 503)
  const { error } = await createServerClient().from("favorites").delete().eq("user_id", user.id).eq("target_type", t.type).eq("target_id", t.id)
  if (error) return createErrorResponse("Failed to remove", 500)
  return NextResponse.json({ ok: true })
})
