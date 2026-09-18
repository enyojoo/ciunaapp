import { type NextRequest, NextResponse } from "next/server"
import { isUuidLike, normalizePublicSlug } from "@ciuna/shared"
import { createServerClient } from "@/lib/supabase"
import { withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { EXPERT_CATALOG_JSON_CACHE_CONTROL } from "@/lib/expert-http-cache"

const PROFILE_FIELDS =
  "id, slug, display_name, headline, bio, is_published, category, image_url, capabilities, service_area, meeting_hint, created_at"

const SERVICE_FIELDS_BASE =
  "id, title, short_description, sort_order, is_published, pricing_type, hourly_rate, hourly_currency, fixed_amount, fixed_currency, package_label, default_duration_minutes, min_session_minutes, max_session_minutes"

/** Includes fulfillment_type when the column exists (after docs/sql/expert-services-fulfillment.sql). */
const SERVICE_FIELDS_WITH_FULFILLMENT = `${SERVICE_FIELDS_BASE}, fulfillment_type`

function isMissingFulfillmentColumnError(err: { message?: string } | null): boolean {
  const m = String(err?.message || "").toLowerCase()
  if (!m.includes("fulfillment_type")) return false
  return (
    m.includes("does not exist") ||
    m.includes("schema cache") ||
    m.includes("could not find") ||
    m.includes("unknown column")
  )
}

export const GET = withErrorHandling(async (_request: NextRequest, context?: { params: Promise<{ slug: string }> }) => {
  if (!context?.params) return createErrorResponse("Missing slug", 400)
  const { slug: segment } = await context.params
  const raw = decodeURIComponent(String(segment || "").trim())
  if (!raw) return createErrorResponse("Missing slug", 400)

  const server = createServerClient()

  let profileQuery = server.from("expert_profiles").select(PROFILE_FIELDS).eq("is_published", true)
  if (isUuidLike(raw)) {
    profileQuery = profileQuery.eq("id", raw)
  } else {
    profileQuery = profileQuery.eq("slug", normalizePublicSlug(raw))
  }

  const { data: profile, error } = await profileQuery.maybeSingle()

  if (error) {
    console.error("expert profile GET", error)
    return createErrorResponse("Failed to load expert", 500)
  }
  if (!profile) return createErrorResponse("Not found", 404)

  const profileId = profile.id as string

  const fetchPublishedServices = (fields: string) =>
    server
      .from("expert_services")
      .select(fields)
      .eq("expert_profile_id", profileId)
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })

  let { data: services, error: sErr } = await fetchPublishedServices(SERVICE_FIELDS_WITH_FULFILLMENT)

  if (sErr && isMissingFulfillmentColumnError(sErr)) {
    const retry = await fetchPublishedServices(SERVICE_FIELDS_BASE)
    services = retry.data
    sErr = retry.error
    if (!sErr && services?.length) {
      services = services.map((row) => ({ ...row, fulfillment_type: "online" as const }))
    }
  }

  if (sErr) {
    console.error("expert profile services", sErr)
    return createErrorResponse("Failed to load expert", 500)
  }

  const res = NextResponse.json({ profile, services: services || [] })
  res.headers.set("Cache-Control", EXPERT_CATALOG_JSON_CACHE_CONTROL)
  return res
})
