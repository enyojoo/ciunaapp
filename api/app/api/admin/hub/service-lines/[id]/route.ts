import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireSuperAdmin, SuperAdminRequiredError } from "@/lib/admin-auth-utils"

function adminRouteErrorStatus(e: unknown): number {
  if (e instanceof SuperAdminRequiredError) return 403
  if (e instanceof Error && e.message === "Admin access required") return 401
  return 500
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin(request)
    const { id } = await params
    const body = await request.json()
    const server = createServerClient()

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.title != null) patch.title = String(body.title).trim() || "Untitled"
    if (body.short_description !== undefined) patch.short_description = body.short_description
    if (body.sort_order != null) patch.sort_order = Number(body.sort_order)
    if (body.is_enabled != null) patch.is_enabled = Boolean(body.is_enabled)
    if (body.icon_url !== undefined) patch.icon_url = body.icon_url
    if (body.icon_key !== undefined) patch.icon_key = body.icon_key
    if (body.grid_kind != null) {
      const g = String(body.grid_kind)
      if (g === "hub_category" || g === "app_link" || g === "external_url") patch.grid_kind = g
    }
    if (body.route_path !== undefined) patch.route_path = body.route_path
    if (body.href !== undefined) patch.href = body.href
    if (body.slug != null) {
      patch.slug = String(body.slug)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
    }

    const { data, error } = await server.from("hub_service_lines").update(patch).eq("id", id).select().single()
    if (error) throw error
    return NextResponse.json({ serviceLine: data })
  } catch (e) {
    console.error("admin hub service-lines PATCH", e)
    const status = adminRouteErrorStatus(e)
    return NextResponse.json({ error: "Failed to update service line" }, { status })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin(request)
    const { id } = await params
    const server = createServerClient()
    const { error } = await server.from("hub_service_lines").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("admin hub service-lines DELETE", e)
    const status = adminRouteErrorStatus(e)
    return NextResponse.json({ error: "Failed to delete service line" }, { status })
  }
}
