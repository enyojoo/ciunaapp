import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAdmin } from "@/lib/admin-auth-utils"
import { buildExpertServiceRow } from "@/lib/expert-admin-validation"

const SERVICE_SELECT =
  "id, expert_profile_id, title, short_description, sort_order, is_published, fulfillment_type, pricing_type, hourly_rate, hourly_currency, fixed_amount, fixed_currency, package_label, default_duration_minutes, min_session_minutes, max_session_minutes, created_at, updated_at"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request)
    const { id: profileId } = await params
    if (!profileId) return NextResponse.json({ error: "Missing profile id" }, { status: 400 })
    const server = createServerClient()
    const { data: prof, error: pe } = await server.from("expert_profiles").select("id").eq("id", profileId).maybeSingle()
    if (pe || !prof) return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    const { data, error } = await server
      .from("expert_services")
      .select(SERVICE_SELECT)
      .eq("expert_profile_id", profileId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
    if (error) throw error
    return NextResponse.json({ services: data || [] })
  } catch (e) {
    console.error("admin expert services GET", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to load services" }, { status })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request)
    const { id: profileId } = await params
    if (!profileId) return NextResponse.json({ error: "Missing profile id" }, { status: 400 })
    const body = await request.json().catch(() => ({}))
    const server = createServerClient()
    const { data: prof, error: pe } = await server.from("expert_profiles").select("id").eq("id", profileId).maybeSingle()
    if (pe || !prof) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

    const built = buildExpertServiceRow(body as Record<string, unknown>)
    if (built.error) return NextResponse.json({ error: built.error }, { status: 400 })

    const row = { ...built.row, expert_profile_id: profileId }
    const { data, error } = await server.from("expert_services").insert(row).select(SERVICE_SELECT).single()
    if (error) throw error
    return NextResponse.json({ service: data })
  } catch (e) {
    console.error("admin expert services POST", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to create service" }, { status })
  }
}
