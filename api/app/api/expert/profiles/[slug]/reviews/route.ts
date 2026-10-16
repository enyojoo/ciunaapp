import { type NextRequest, NextResponse } from "next/server"
import { isUuidLike, normalizePublicSlug } from "@ciuna/shared"
import { createServerClient } from "@/lib/supabase"
import { withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { buildSummary, listPublicReviews, parsePaging } from "@/lib/merchant/reviews"

export const dynamic = "force-dynamic"
export const revalidate = 0

/** Public: published reviews of a published expert. ?limit&offset */
export const GET = withErrorHandling(async (request: NextRequest, context?: { params: Promise<{ slug: string }> }) => {
  if (!context?.params) return createErrorResponse("Missing slug", 400)
  const { slug: segment } = await context.params
  const raw = decodeURIComponent(String(segment || "").trim())
  if (!raw) return createErrorResponse("Missing slug", 400)

  let q = createServerClient().from("expert_profiles").select("id, merchant_id").eq("is_published", true)
  q = isUuidLike(raw) ? q.eq("id", raw) : q.eq("slug", normalizePublicSlug(raw))
  const { data: profile, error } = await q.maybeSingle()
  if (error) {
    console.error("expert reviews", error)
    return createErrorResponse("Failed to load reviews", 500)
  }
  if (!profile) return createErrorResponse("Not found", 404)

  const { limit, offset } = parsePaging(new URL(request.url).searchParams)
  const merchantId = (profile as any).merchant_id as string | null
  const data = merchantId ? await listPublicReviews(merchantId, "expert", limit, offset) : { summary: buildSummary(null), reviews: [] }
  const res = NextResponse.json(data)
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
  return res
})
