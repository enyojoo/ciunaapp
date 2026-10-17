import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { safeSelect } from "@/lib/safe-select"
import { withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { storefrontFields } from "@/lib/merchant/storefront"
import { loadDeliveryInfo, noDelivery } from "@/lib/delivery-info"

const ALLOWED_LINES = new Set(["food", "mart"])

export const dynamic = "force-dynamic"
export const revalidate = 0

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const serviceLine = String(searchParams.get("service_line") || "").trim().toLowerCase()
  if (!ALLOWED_LINES.has(serviceLine)) {
    return createErrorResponse("Invalid or missing service_line (use food or mart)", 400)
  }

  const server = createServerClient()
  const { data, error } = await safeSelect("hub_vendors", "id, service_line_slug, name, slug, photo_url, short_bio, location, is_published, is_verified, rating_avg, rating_count, created_at, updated_at, opening_hours, time_zone, min_order_amount, min_order_currency, cover_url, verification_tier", (cols) =>
    server
      .from("hub_vendors")
      .select(cols)
      .eq("service_line_slug", serviceLine)
      .eq("is_published", true)
      .order("name", { ascending: true }),
  )

  if (error) {
    console.error("hub vendors list", error)
    return createErrorResponse("Failed to load vendors", 500)
  }

  const delivery = await loadDeliveryInfo(server, (data || []).map((v: any) => String(v.id)))
  const res = NextResponse.json({ vendors: (data || []).map((v: any) => ({ rating_avg: null, rating_count: 0, ...v, ...storefrontFields(v), ...(delivery.get(String(v.id)) ?? noDelivery()) })) })
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
  return res
})
