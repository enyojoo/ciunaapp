import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { getPublishedHubVendorForLine } from "@/lib/hub-vendor-resolve"
import { tableExists } from "@/lib/merchant/messages"
import { buildSummary, listPublicReviews, parsePaging } from "@/lib/merchant/reviews"

const ALLOWED_LINES = new Set(["food", "mart"])

export const dynamic = "force-dynamic"
export const revalidate = 0

/** Public: published reviews of a published vendor. ?service_line=food|mart&limit&offset */
export const GET = withErrorHandling(async (request: NextRequest, context?: { params?: Promise<{ vendorSlug: string }> }) => {
  const params = context?.params ? await context.params : { vendorSlug: "" }
  const slug = String(params.vendorSlug || "").trim().toLowerCase()
  if (!slug) return createErrorResponse("Missing vendor slug", 400)
  const sp = new URL(request.url).searchParams
  const line = String(sp.get("service_line") || "").trim().toLowerCase()
  if (!ALLOWED_LINES.has(line)) return createErrorResponse("Invalid or missing service_line (use food or mart)", 400)

  const { row: vendor, error } = await getPublishedHubVendorForLine(createServerClient(), slug, line as "food" | "mart")
  if (error) {
    console.error("vendor reviews", error)
    return createErrorResponse("Failed to load reviews", 500)
  }
  if (!vendor?.id) return createErrorResponse("Vendor not found", 404)

  const { limit, offset } = parsePaging(sp)
  const merchantId = (vendor as any).merchant_id as string | null
  const data = merchantId && (await tableExists("reviews")) ? await listPublicReviews(merchantId, "vendor", limit, offset) : { summary: buildSummary(null), reviews: [] }
  const res = NextResponse.json(data)
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
  return res
})
