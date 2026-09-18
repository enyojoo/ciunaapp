import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { EXPERT_CATALOG_JSON_CACHE_CONTROL } from "@/lib/expert-http-cache"

const PROFILE_FIELDS = "id, slug, display_name, image_url, category, is_published"

const SERVICE_FIELDS_BASE =
  "id, expert_profile_id, title, short_description, sort_order, is_published, pricing_type, hourly_rate, hourly_currency, fixed_amount, fixed_currency, package_label, default_duration_minutes, min_session_minutes, max_session_minutes, created_at"

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

type CatalogExpertSummary = {
  id: string
  slug: string | null
  display_name: string
  image_url: string | null
  category: string | null
  /** Reserved for a future `expert_profiles.is_verified` column; false until wired. */
  is_verified: boolean
}

type CatalogServiceRow = {
  id: string
  expert_profile_id: string
  title: string
  short_description: string | null
  sort_order: number | null
  fulfillment_type?: string | null
  pricing_type: string
  hourly_rate: number | null
  hourly_currency: string | null
  fixed_amount: number | null
  fixed_currency: string | null
  package_label: string | null
  default_duration_minutes: number | null
  created_at: string
  expert: CatalogExpertSummary
}

export const GET = withErrorHandling(async (_request: NextRequest) => {
  const server = createServerClient()

  const { data: profiles, error: pErr } = await server
    .from("expert_profiles")
    .select(PROFILE_FIELDS)
    .eq("is_published", true)

  if (pErr) {
    console.error("expert catalog-services profiles", pErr)
    return createErrorResponse("Failed to load experts", 500)
  }

  const profileRows = profiles || []
  const profileById = new Map<string, Record<string, unknown>>()
  for (const p of profileRows) {
    const row = p as Record<string, unknown>
    const id = row.id != null ? String(row.id) : ""
    if (id) profileById.set(id, row)
  }

  let { data: svcRows, error: sErr } = await server.from("expert_services").select(SERVICE_FIELDS_WITH_FULFILLMENT).eq("is_published", true)

  if (sErr && isMissingFulfillmentColumnError(sErr)) {
    const retry = await server.from("expert_services").select(SERVICE_FIELDS_BASE).eq("is_published", true)
    svcRows = retry.data?.map((row) => ({ ...row, fulfillment_type: "online" as const }))
    sErr = retry.error
  }

  if (sErr) {
    console.error("expert catalog-services services", sErr)
    return createErrorResponse("Failed to load services", 500)
  }

  const services: CatalogServiceRow[] = []
  for (const raw of svcRows || []) {
    const r = raw as Record<string, unknown>
    const pid = r.expert_profile_id != null ? String(r.expert_profile_id) : ""
    const prof = pid ? profileById.get(pid) : undefined
    if (!prof) continue

    services.push({
      id: String(r.id),
      expert_profile_id: pid,
      title: String(r.title ?? ""),
      short_description: r.short_description != null ? String(r.short_description) : null,
      sort_order: r.sort_order != null ? Number(r.sort_order) : null,
      fulfillment_type: r.fulfillment_type != null ? String(r.fulfillment_type) : "online",
      pricing_type: String(r.pricing_type ?? ""),
      hourly_rate: r.hourly_rate != null ? Number(r.hourly_rate) : null,
      hourly_currency: r.hourly_currency != null ? String(r.hourly_currency) : null,
      fixed_amount: r.fixed_amount != null ? Number(r.fixed_amount) : null,
      fixed_currency: r.fixed_currency != null ? String(r.fixed_currency) : null,
      package_label: r.package_label != null ? String(r.package_label) : null,
      default_duration_minutes: r.default_duration_minutes != null ? Number(r.default_duration_minutes) : null,
      created_at: r.created_at != null ? String(r.created_at) : new Date(0).toISOString(),
      expert: {
        id: String(prof.id),
        slug: prof.slug != null ? String(prof.slug) : null,
        display_name: String(prof.display_name ?? ""),
        image_url: prof.image_url != null ? String(prof.image_url) : null,
        category: prof.category != null ? String(prof.category) : null,
        is_verified: false,
      },
    })
  }

  services.sort((a, b) => {
    const tb = new Date(b.created_at).getTime()
    const ta = new Date(a.created_at).getTime()
    return tb - ta
  })

  const res = NextResponse.json({ services })
  res.headers.set("Cache-Control", EXPERT_CATALOG_JSON_CACHE_CONTROL)
  return res
})
