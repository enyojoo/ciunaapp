import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAdmin, AdminForbiddenError } from "@/lib/admin-auth-utils"
import { allocateExpertSlug } from "@/lib/expert-slug-server"
import { isMissingSchemaError } from "@/lib/safe-select"

const PROFILE_SELECT_BASE =
  "id, slug, display_name, headline, bio, is_published, category, image_url, capabilities, fulfillment_type, service_area, meeting_hint, created_at, updated_at"
const PROFILE_SELECT = `${PROFILE_SELECT_BASE}, main_category`

/** The eight fixed needs the apps group experts by. Must match the check on expert_profiles.main_category. */
const MAIN_CATEGORIES = new Set(["documents", "translation", "education", "work", "housing", "health", "beauty", "errands"])

function mainCategoryInput(v: unknown): string | null {
  const s = String(v ?? "").trim().toLowerCase()
  return MAIN_CATEGORIES.has(s) ? s : null
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)
    const server = createServerClient()
    const list = (cols: string) => server.from("expert_profiles").select(cols).order("updated_at", { ascending: false }).limit(500)
    let { data, error } = await list(PROFILE_SELECT)
    if (error && isMissingSchemaError(error)) ({ data, error } = await list(PROFILE_SELECT_BASE))
    if (error) throw error
    return NextResponse.json({ profiles: data || [] })
  } catch (e) {
    if (e instanceof AdminForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    console.error("admin expert profiles GET", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to load expert profiles" }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)
    const body = await request.json().catch(() => ({}))
    const server = createServerClient()
    const display_name = String(body.display_name || "").trim() || "Expert"
    const slugSource =
      body.slug != null && String(body.slug).trim() !== "" ? String(body.slug) : display_name
    let slug: string
    try {
      slug = await allocateExpertSlug(server, slugSource)
    } catch (e) {
      if (e instanceof AdminForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      console.error("admin expert profiles slug", e)
      const detail = e instanceof Error ? e.message : String(e)
      return NextResponse.json({ error: "Failed to allocate URL slug", detail }, { status: 500 })
    }
    const row = {
      slug,
      display_name,
      headline: body.headline != null ? String(body.headline).trim() || null : null,
      bio: body.bio != null ? String(body.bio).trim() || null : null,
      is_published: Boolean(body.is_published),
      category: String(body.category || "Other").trim() || "Other",
      main_category: mainCategoryInput(body.main_category),
      image_url: body.image_url != null ? String(body.image_url).trim() || null : null,
      capabilities: typeof body.capabilities === "object" && body.capabilities !== null ? body.capabilities : {},
      fulfillment_type: "online",
      service_area: body.service_area != null ? String(body.service_area).trim() || null : null,
      meeting_hint: body.meeting_hint != null ? String(body.meeting_hint).trim() || null : null,
      updated_at: new Date().toISOString(),
    }
    let { data, error } = await server.from("expert_profiles").insert(row).select(PROFILE_SELECT).single()
    if (error && isMissingSchemaError(error)) {
      const { main_category: _unused, ...rest } = row
      ;({ data, error } = await server.from("expert_profiles").insert(rest).select(PROFILE_SELECT_BASE).single())
    }
    if (error) throw error
    return NextResponse.json({ profile: data })
  } catch (e) {
    if (e instanceof AdminForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    console.error("admin expert profiles POST", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to create expert profile" }, { status })
  }
}
