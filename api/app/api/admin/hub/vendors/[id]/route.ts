import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAdmin } from "@/lib/admin-auth-utils"

const ALLOWED_LINES = new Set(["food", "mart"])

function normalizeSlug(s: string): string {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request)
    const { id } = await params
    const server = createServerClient()
    const { data, error } = await server.from("hub_vendors").select("*").eq("id", id).single()
    if (error) throw error
    return NextResponse.json({ vendor: data })
  } catch (e) {
    console.error("admin hub vendor GET", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Not found" }, { status })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request)
    const { id } = await params
    const body = await request.json()
    const server = createServerClient()

    const service_line_slug = String(body.service_line_slug || "").trim().toLowerCase()
    if (body.service_line_slug != null && !ALLOWED_LINES.has(service_line_slug)) {
      return NextResponse.json({ error: "service_line_slug must be food or mart" }, { status: 400 })
    }

    const row: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.name != null) row.name = String(body.name || "").trim() || "Unnamed vendor"
    if (body.slug != null) {
      const slug = normalizeSlug(body.slug)
      if (!slug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 })
      row.slug = slug
    }
    if (body.photo_url !== undefined) row.photo_url = body.photo_url != null ? String(body.photo_url).trim() || null : null
    if (body.short_bio !== undefined) row.short_bio = body.short_bio != null ? String(body.short_bio).trim() || null : null
    if (body.location !== undefined) row.location = body.location != null ? String(body.location).trim() || null : null
    if (body.is_published !== undefined) row.is_published = Boolean(body.is_published)
    if (body.is_verified !== undefined) row.is_verified = Boolean(body.is_verified)
    if (body.service_line_slug != null) row.service_line_slug = service_line_slug

    const { data, error } = await server.from("hub_vendors").update(row).eq("id", id).select().maybeSingle()
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Slug already exists for this service line" }, { status: 409 })
      }
      throw error
    }
    if (!data) return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    return NextResponse.json({ vendor: data })
  } catch (e) {
    console.error("admin hub vendor PATCH", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to update vendor" }, { status })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request)
    const { id } = await params
    const server = createServerClient()
    const { error } = await server.from("hub_vendors").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("admin hub vendor DELETE", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to delete" }, { status })
  }
}
