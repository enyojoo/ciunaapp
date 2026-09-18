import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { getPublishedHubVendorForLine } from "@/lib/hub-vendor-resolve"

const ALLOWED_LINES = new Set(["food", "mart"])

export const dynamic = "force-dynamic"
export const revalidate = 0

export const GET = withErrorHandling(async (request: NextRequest, context?: { params?: Promise<{ vendorSlug: string }> }) => {
  const params = context?.params ? await context.params : { vendorSlug: "" }
  const vendorSlug = params.vendorSlug
  const slug = String(vendorSlug || "").trim().toLowerCase()
  if (!slug) {
    return createErrorResponse("Missing vendor slug", 400)
  }

  const { searchParams } = new URL(request.url)
  const serviceLine = String(searchParams.get("service_line") || "").trim().toLowerCase()
  if (!ALLOWED_LINES.has(serviceLine)) {
    return createErrorResponse("Invalid or missing service_line (use food or mart)", 400)
  }

  const server = createServerClient()
  const { row: vendor, error } = await getPublishedHubVendorForLine(server, slug, serviceLine as "food" | "mart")

  if (error) {
    console.error("hub vendor by slug", error)
    return createErrorResponse("Failed to load vendor", 500)
  }
  if (!vendor?.id) {
    return createErrorResponse("Vendor not found", 404)
  }

  const res = NextResponse.json({
    vendor: {
      id: String(vendor.id),
      service_line_slug: vendor.service_line_slug != null ? String(vendor.service_line_slug) : null,
      name: String(vendor.name || ""),
      slug: String(vendor.slug || ""),
      photo_url: vendor.photo_url != null ? String(vendor.photo_url) : null,
      short_bio: vendor.short_bio != null ? String(vendor.short_bio) : null,
      location: vendor.location != null ? String(vendor.location) : null,
      is_published: Boolean(vendor.is_published),
      is_verified: Boolean(vendor.is_verified),
      created_at: String(vendor.created_at || ""),
      updated_at: String(vendor.updated_at || ""),
    },
  })
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
  return res
})
