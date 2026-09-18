import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAdmin } from "@/lib/admin-auth-utils"
import { allocateExpertSlug } from "@/lib/expert-slug-server"

const PROFILE_SELECT =
  "id, slug, display_name, headline, bio, is_published, category, image_url, capabilities, fulfillment_type, service_area, meeting_hint, created_at, updated_at"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request)
    const { id } = await params
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    const server = createServerClient()
    const { data, error } = await server.from("expert_profiles").select(PROFILE_SELECT).eq("id", id).maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ profile: data })
  } catch (e) {
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
    if (body.headline !== undefined) patch.headline = body.headline != null ? String(body.headline).trim() || null : null
    if (body.bio !== undefined) patch.bio = body.bio != null ? String(body.bio).trim() || null : null
    if (body.is_published !== undefined) patch.is_published = Boolean(body.is_published)
    if (body.category != null) patch.category = String(body.category).trim() || "Other"
    if (body.image_url !== undefined) patch.image_url = body.image_url != null ? String(body.image_url).trim() || null : null
    if (body.capabilities !== undefined)
      patch.capabilities = typeof body.capabilities === "object" && body.capabilities !== null ? body.capabilities : {}
    if (body.service_area !== undefined) patch.service_area = body.service_area != null ? String(body.service_area).trim() || null : null
    if (body.meeting_hint !== undefined) patch.meeting_hint = body.meeting_hint != null ? String(body.meeting_hint).trim() || null : null

    if (body.slug !== undefined) {
      const { data: existing } = await server.from("expert_profiles").select("display_name").eq("id", id).maybeSingle()
      const baseName =
        patch.display_name != null && typeof patch.display_name === "string"
          ? patch.display_name
          : String(existing?.display_name || "").trim() || "Expert"
      const slugSource =
        body.slug != null && String(body.slug).trim() !== "" ? String(body.slug) : baseName
      try {
        patch.slug = await allocateExpertSlug(server, slugSource, id)
      } catch (e) {
        console.error("admin expert profile slug", e)
        return NextResponse.json({ error: "Failed to update URL slug" }, { status: 500 })
      }
    }

    const { data, error } = await server.from("expert_profiles").update(patch).eq("id", id).select(PROFILE_SELECT).single()
    if (error) throw error
    return NextResponse.json({ profile: data })
  } catch (e) {
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
    const { error } = await server.from("expert_profiles").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("admin expert profile DELETE", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to delete profile" }, { status })
  }
}
