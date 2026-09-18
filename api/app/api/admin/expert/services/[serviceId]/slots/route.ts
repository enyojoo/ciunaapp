import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAdmin } from "@/lib/admin-auth-utils"

const SLOT_SELECT = "id, expert_service_id, slot_start, slot_end, status, source, schedule_id, created_at, updated_at"

export async function GET(request: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) {
  try {
    await requireAdmin(request)
    const { serviceId } = await params
    if (!serviceId) return NextResponse.json({ error: "Missing serviceId" }, { status: 400 })
    const server = createServerClient()
    const { data, error } = await server
      .from("expert_service_slots")
      .select(SLOT_SELECT)
      .eq("expert_service_id", serviceId)
      .order("slot_start", { ascending: true })
    if (error) throw error
    return NextResponse.json({ slots: data || [] })
  } catch (e) {
    console.error("admin expert slots GET", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to load slots" }, { status })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) {
  try {
    await requireAdmin(request)
    const { serviceId } = await params
    if (!serviceId) return NextResponse.json({ error: "Missing serviceId" }, { status: 400 })
    const body = await request.json().catch(() => ({}))
    const slotStart = body.slot_start != null ? String(body.slot_start).trim() : ""
    const slotEnd = body.slot_end != null ? String(body.slot_end).trim() : ""
    if (!slotStart || !slotEnd) return NextResponse.json({ error: "slot_start and slot_end required" }, { status: 400 })
    const server = createServerClient()
    const { data: svc, error: se } = await server.from("expert_services").select("id").eq("id", serviceId).maybeSingle()
    if (se || !svc) return NextResponse.json({ error: "Service not found" }, { status: 404 })

    const row = {
      expert_service_id: serviceId,
      slot_start: slotStart,
      slot_end: slotEnd,
      status: "available",
      source: "manual",
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await server.from("expert_service_slots").insert(row).select(SLOT_SELECT).single()
    if (error) throw error
    return NextResponse.json({ slot: data })
  } catch (e) {
    console.error("admin expert slots POST", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to create slot" }, { status })
  }
}
