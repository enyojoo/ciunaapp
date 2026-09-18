import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { sortHubProductRows } from "@/lib/hub-products-sort"
import { hubVendorDbRowToProductSummary } from "@/lib/hub-product-vendors"
import { getPublishedHubVendorForLine } from "@/lib/hub-vendor-resolve"
import type { HubProductRow } from "@/lib/hub-types"

const ALLOWED_LINES = new Set(["food", "mart"])

export const dynamic = "force-dynamic"
export const revalidate = 0

export const GET = withErrorHandling(async (request: NextRequest, context?: { params?: Promise<{ vendorSlug: string }> }) => {
  const params = context?.params ? await context.params : { vendorSlug: "" }
  const vendorSlugParam = params.vendorSlug
  const slug = String(vendorSlugParam || "").trim().toLowerCase()
  if (!slug) {
    return createErrorResponse("Missing vendor slug", 400)
  }

  const { searchParams } = new URL(request.url)
  const serviceLine = String(searchParams.get("service_line") || "").trim().toLowerCase()
  if (!ALLOWED_LINES.has(serviceLine)) {
    return createErrorResponse("Invalid or missing service_line (use food or mart)", 400)
  }

  const server = createServerClient()

  const { row: vendor, error: vErr } = await getPublishedHubVendorForLine(server, slug, serviceLine as "food" | "mart")

  if (vErr) {
    console.error("hub vendor lookup", vErr)
    return createErrorResponse("Failed to resolve vendor", 500)
  }
  if (!vendor?.id) {
    return createErrorResponse("Vendor not found", 404)
  }

  const vendorId = String(vendor.id)

  const { data: products, error: pErr } = await server
    .from("hub_products")
    .select("*")
    .eq("status", "live")
    .eq("vendor_id", vendorId)
    .order("updated_at", { ascending: false })

  if (pErr) {
    console.error("hub vendor products", pErr)
    return createErrorResponse("Failed to load products", 500)
  }

  const vendorSummary = hubVendorDbRowToProductSummary(vendor as Record<string, unknown>)
  const withVendor: HubProductRow[] = (products || []).map((p) => ({
    ...(p as HubProductRow),
    vendor: vendorSummary,
  }))

  const res = NextResponse.json({ products: sortHubProductRows(withVendor) })
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
  return res
})
