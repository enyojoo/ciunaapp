import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAdmin } from "@/lib/admin-auth-utils"
import { buildExpertServiceRow } from "@/lib/expert-admin-validation"

const SERVICE_SELECT =
  "id, expert_profile_id, title, short_description, sort_order, is_published, fulfillment_type, pricing_type, hourly_rate, hourly_currency, fixed_amount, fixed_currency, package_label, default_duration_minutes, min_session_minutes, max_session_minutes, booking_lead_minutes, payment_cutoff_minutes, timezone, meeting_instructions, created_at, updated_at"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> },
) {
  try {
    await requireAdmin(request)
    const { id: profileId, serviceId } = await params
    if (!profileId || !serviceId) return NextResponse.json({ error: "Missing ids" }, { status: 400 })
    const body = await request.json().catch(() => ({}))
    const server = createServerClient()
    const { data: current, error: exErr } = await server
      .from("expert_services")
      .select(SERVICE_SELECT)
      .eq("id", serviceId)
      .eq("expert_profile_id", profileId)
      .maybeSingle()
    if (exErr || !current) return NextResponse.json({ error: "Service not found" }, { status: 404 })

    const merged = { ...current, ...body, title: body.title != null ? body.title : current.title }
    if (
      body.pricing_type != null ||
      body.hourly_rate != null ||
      body.fixed_amount != null ||
      body.fulfillment_type !== undefined
    ) {
      const built = buildExpertServiceRow(merged as Record<string, unknown>)
      if (built.error) return NextResponse.json({ error: built.error }, { status: 400 })
    }

    const built = buildExpertServiceRow(merged as Record<string, unknown>)
    if (built.error) return NextResponse.json({ error: built.error }, { status: 400 })
    const patch = built.row

    const { data, error } = await server
      .from("expert_services")
      .update(patch)
      .eq("id", serviceId)
      .select(SERVICE_SELECT)
      .single()
    if (error) throw error
    return NextResponse.json({ service: data })
  } catch (e) {
    console.error("admin expert service PATCH", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to update service" }, { status })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> },
) {
  try {
    await requireAdmin(request)
    const { id: profileId, serviceId } = await params
    if (!profileId || !serviceId) return NextResponse.json({ error: "Missing ids" }, { status: 400 })
    const server = createServerClient()
    const { error } = await server
      .from("expert_services")
      .update({ is_published: false, updated_at: new Date().toISOString() })
      .eq("id", serviceId)
      .eq("expert_profile_id", profileId)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("admin expert service DELETE", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to delete service" }, { status })
  }
}
