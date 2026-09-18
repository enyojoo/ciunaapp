import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAuth, withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { sortHubProductRows } from "@/lib/hub-products-sort"
import { enrichHubProductsWithVendors } from "@/lib/hub-product-vendors"
import { hubProductBelongsToServiceLine } from "@/lib/hub-slug"
import type { HubProductRow } from "@/lib/hub-types"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const GET = withErrorHandling(async (request: NextRequest) => {
  const server = createServerClient()
  const { searchParams } = new URL(request.url)
  const serviceLine = String(searchParams.get("service_line") || "").trim().toLowerCase()
  const publicMarketplaceSlice = serviceLine === "food" || serviceLine === "mart"

  if (!publicMarketplaceSlice) {
    try {
      await requireAuth(request)
    } catch {
      return createErrorResponse("Unauthorized", 401)
    }
  }

  let q = server.from("hub_products").select("*").eq("status", "live").order("updated_at", { ascending: false })
  // Include products with an explicit service_line_slug match OR products without a slug
  // (legacy rows where the slug is derived from category). Server-side filter below
  // enforces which ones actually belong to this line.
  if (serviceLine === "food" || serviceLine === "mart") {
    q = q.or(`service_line_slug.eq.${serviceLine},service_line_slug.is.null`)
  }

  const { data, error } = await q

  if (error) {
    console.error("hub products list", error)
    return createErrorResponse("Failed to load products", 500)
  }

  let rows = (data || []) as HubProductRow[]
  // Remove any row that does not actually belong to this line (e.g. null-slug products
  // whose category doesn't match, or products tagged for the other marketplace line).
  if (serviceLine === "food" || serviceLine === "mart") {
    rows = rows.filter((p) => hubProductBelongsToServiceLine(p, serviceLine))
  }

  const enriched = await enrichHubProductsWithVendors(server, rows)

  const res = NextResponse.json({ products: sortHubProductRows(enriched) })
  // Always serve fresh data from the DB; no shared / browser cache between food / mart navigations.
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
  return res
})
