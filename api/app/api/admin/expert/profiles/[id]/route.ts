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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request)
    const { id } = await params
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    const server = createServerClient()
    let { data, error } = await server.from("expert_profiles").select(PROFILE_SELECT).eq("id", id).maybeSingle()
    // Before expert-main-category.sql runs, load without the column (Office then shows the field as unavailable).
    if (error && isMissingSchemaError(error)) ({ data, error } = await server.from("expert_profiles").select(PROFILE_SELECT_BASE).eq("id", id).maybeSingle())
    if (error) throw error
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ profile: data })
  } catch (e) {
    if (e instanceof AdminForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    console.error("admin expert profile GET", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to load profile" }, { status })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request)
    const { id } = await params
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    const body = await request.json().catch(() => ({}))
    const server = createServerClient()
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.display_name != null) patch.display_name = String(body.display_name).trim() || "Expert"
    if (body.headline !== undefined)
      patch.headline = body.headline != null ? String(body.headline).trim() || null : null
    if (body.bio !== undefined) patch.bio = body.bio != null ? String(body.bio).trim() || null : null
    if (body.is_published !== undefined) patch.is_published = Boolean(body.is_published)
    if (body.category != null) patch.category = String(body.category).trim() || "Other"
    if (body.main_category !== undefined) {
      const main = mainCategoryInput(body.main_category)
      if (body.main_category !== null && body.main_category !== "" && !main) return NextResponse.json({ error: "Unknown main category" }, { status: 400 })
      patch.main_category = main
    }
    if (body.image_url !== undefined)
      patch.image_url = body.image_url != null ? String(body.image_url).trim() || null : null
    if (body.capabilities !== undefined)
      patch.capabilities =
        typeof body.capabilities === "object" && body.capabilities !== null ? body.capabilities : {}
    if (body.service_area !== undefined)
      patch.service_area = body.service_area != null ? String(body.service_area).trim() || null : null
    if (body.meeting_hint !== undefined)
      patch.meeting_hint = body.meeting_hint != null ? String(body.meeting_hint).trim() || null : null

    if (body.slug !== undefined) {
      const { data: existing } = await server
        .from("expert_profiles")
        .select("display_name")
        .eq("id", id)
        .maybeSingle()
      const baseName =
        patch.display_name != null && typeof patch.display_name === "string"
          ? patch.display_name
          : String(existing?.display_name || "").trim() || "Expert"
      const slugSource = body.slug != null && String(body.slug).trim() !== "" ? String(body.slug) : baseName
      try {
        patch.slug = await allocateExpertSlug(server, slugSource, id)
      } catch (e) {
        if (e instanceof AdminForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        console.error("admin expert profile slug", e)
        return NextResponse.json({ error: "Failed to update URL slug" }, { status: 500 })
      }
    }

    let { data, error } = await server.from("expert_profiles").update(patch).eq("id", id).select(PROFILE_SELECT).single()
    if (error && isMissingSchemaError(error)) {
      // The column does not exist yet: save everything else.
      delete patch.main_category
      ;({ data, error } = await server.from("expert_profiles").update(patch).eq("id", id).select(PROFILE_SELECT_BASE).single())
    }
    if (error) throw error
    return NextResponse.json({ profile: data })
  } catch (e) {
    if (e instanceof AdminForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    console.error("admin expert profile PATCH", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to update profile" }, { status })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request)
    const { id } = await params
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    const server = createServerClient()
    const { error } = await server
      .from("expert_profiles")
      .update({ is_published: false, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof AdminForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    console.error("admin expert profile DELETE", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to delete profile" }, { status })
  }
}
