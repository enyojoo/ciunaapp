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

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const serviceLine = String(searchParams.get("service_line") || "").trim().toLowerCase()

    const server = createServerClient()
    let q = server
      .from("hub_vendors")
      .select("*")
      .order("service_line_slug", { ascending: true })
      .order("name", { ascending: true })

    if (serviceLine) {
      if (!ALLOWED_LINES.has(serviceLine)) {
        return NextResponse.json({ error: "Invalid service_line" }, { status: 400 })
      }
      q = q.eq("service_line_slug", serviceLine)
    }

    const { data, error } = await q
    if (error) throw error
    return NextResponse.json({ vendors: data || [] })
  } catch (e) {
    console.error("admin hub vendors GET", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to load vendors" }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)
    const body = await request.json()
    const server = createServerClient()

    const service_line_slug = String(body.service_line_slug || "").trim().toLowerCase()
    if (!ALLOWED_LINES.has(service_line_slug)) {
      return NextResponse.json({ error: "service_line_slug must be food or mart" }, { status: 400 })
    }

    const name = String(body.name || "").trim() || "Unnamed vendor"
    const slug = normalizeSlug(body.slug || body.name || "")
    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 })
    }

    const row = {
      service_line_slug,
      name,
      slug,
      photo_url: body.photo_url != null ? String(body.photo_url).trim() || null : null,
      short_bio: body.short_bio != null ? String(body.short_bio).trim() || null : null,
      location: body.location != null ? String(body.location).trim() || null : null,
      is_published: Boolean(body.is_published),
      is_verified: Boolean(body.is_verified),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await server.from("hub_vendors").insert(row).select().single()
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Slug already exists for this service line" }, { status: 409 })
      }
      throw error
    }
    return NextResponse.json({ vendor: data })
  } catch (e) {
    console.error("admin hub vendors POST", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to create vendor" }, { status })
  }
}
