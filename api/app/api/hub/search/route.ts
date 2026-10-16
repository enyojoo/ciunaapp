import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { createErrorResponse, withErrorHandling } from "@/lib/auth-utils"
import { cleanQuery, likePattern } from "@/lib/discovery"
import { filterToPublishedVendors } from "@/lib/hub-product-vendors"
import { rateLimit, clientIp, LIMITS } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"
export const revalidate = 0

/** Public search. ?q=...&line=food|mart|experts|all&limit=20 -> { products, vendors, experts }. Published, sellable results only. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  if (!(await rateLimit(`search:${clientIp(request)}`, LIMITS.search.limit, LIMITS.search.windowSeconds))) {
    return NextResponse.json({ error: "Too many searches. Try again in a minute." }, { status: 429, headers: { "Retry-After": "60" } })
  }
  const sp = new URL(request.url).searchParams
  const q = cleanQuery(sp.get("q"))
  if (!q) return createErrorResponse("Type at least 2 characters.", 400)
  const line = String(sp.get("line") || "all").toLowerCase()
  if (!["all", "food", "mart", "experts"].includes(line)) return createErrorResponse("Invalid line", 400)
  const limit = Math.min(Math.max(Number(sp.get("limit")) || 20, 1), 40)
  const pattern = likePattern(q)
  const db = createServerClient()

  const wantsProducts = line === "all" || line === "food" || line === "mart"
  const wantsExperts = line === "all" || line === "experts"

  const [products, vendors, experts] = await Promise.all([
    wantsProducts
      ? (async () => {
          // `translations` arrives with the merchants migration; fall back to the base columns when it is not applied yet.
          const run = (cols: string) => {
            let pq = db.from("hub_products").select(cols).eq("status", "live").or(`title.ilike.${pattern},short_description.ilike.${pattern}`).limit(limit)
            if (line !== "all") pq = pq.eq("service_line_slug", line)
            return pq
          }
          const base = "id,title,short_description,image_url,list_price,sale_price,fixed_amount,fixed_currency,service_line_slug,category,vendor_id,sold_out,stock_quantity"
          const full = await run(`${base},translations`)
          return full.error ? run(base) : full
        })()
      : Promise.resolve({ data: [], error: null }),
    wantsProducts
      ? (() => {
          let vq = db.from("hub_vendors").select("id,name,slug,photo_url,short_bio,service_line_slug,is_verified,location,rating_avg,rating_count").eq("is_published", true).or(`name.ilike.${pattern},short_bio.ilike.${pattern}`).limit(limit)
          if (line !== "all") vq = vq.eq("service_line_slug", line)
          return vq
        })()
      : Promise.resolve({ data: [], error: null }),
    wantsExperts
      ? db.from("expert_profiles").select("id,slug,display_name,headline,image_url,category,rating_avg,rating_count").eq("is_published", true).or(`display_name.ilike.${pattern},headline.ilike.${pattern},category.ilike.${pattern}`).limit(limit)
      : Promise.resolve({ data: [], error: null }),
  ])
  // rating columns arrive with the reviews migration; fall back cleanly if they are not there yet
  const vendorRows = vendors.error ? (await db.from("hub_vendors").select("id,name,slug,photo_url,short_bio,service_line_slug,is_verified,location").eq("is_published", true).ilike("name", pattern).limit(limit)).data : vendors.data
  const expertRows = experts.error ? (await db.from("expert_profiles").select("id,slug,display_name,headline,image_url,category").eq("is_published", true).ilike("display_name", pattern).limit(limit)).data : experts.data
  if (products.error) {
    console.error("search products", products.error)
    return createErrorResponse("Search is unavailable.", 503)
  }
  const sellable = await filterToPublishedVendors(db, (products.data || []) as any[])
  const res = NextResponse.json({ query: q, products: sellable, vendors: vendorRows || [], experts: expertRows || [] })
  res.headers.set("Cache-Control", "no-store")
  return res
})
