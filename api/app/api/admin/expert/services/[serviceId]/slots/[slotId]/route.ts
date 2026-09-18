import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAdmin } from "@/lib/admin-auth-utils"

const SLOT_SELECT = "id, expert_service_id, slot_start, slot_end, status, source, schedule_id, created_at, updated_at"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ serviceId: string; slotId: string }> }) {
  try {
    await requireAdmin(request)
    const { serviceId, slotId } = await params
    if (!serviceId || !slotId) return NextResponse.json({ error: "Missing ids" }, { status: 400 })
    const body = await request.json().catch(() => ({}))
    const server = createServerClient()
    const { data: slot, error: le } = await server
      .from("expert_service_slots")
      .select("id")
      .eq("id", slotId)
      .eq("expert_service_id", serviceId)
      .maybeSingle()
    if (le || !slot) return NextResponse.json({ error: "Slot not found" }, { status: 404 })

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.slot_start != null) patch.slot_start = String(body.slot_start).trim()
    if (body.slot_end != null) patch.slot_end = String(body.slot_end).trim()
    if (body.status != null) {
      const s = String(body.status).trim().toLowerCase()
      if (s === "available" || s === "booked" || s === "cancelled") patch.status = s
    }

    const { data, error } = await server.from("expert_service_slots").update(patch).eq("id", slotId).select(SLOT_SELECT).single()
    if (error) throw error
    return NextResponse.json({ slot: data })
  } catch (e) {
    console.error("admin expert slot PATCH", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to update slot" }, { status })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ serviceId: string; slotId: string }> }) {
  try {
    await requireAdmin(request)
    const { serviceId, slotId } = await params
    if (!serviceId || !slotId) return NextResponse.json({ error: "Missing ids" }, { status: 400 })
    const server = createServerClient()
    const { data: slot, error: le } = await server
      .from("expert_service_slots")
      .select("id, status")
      .eq("id", slotId)
      .eq("expert_service_id", serviceId)
      .maybeSingle()
    if (le || !slot) return NextResponse.json({ error: "Slot not found" }, { status: 404 })
    if (slot.status === "booked") return NextResponse.json({ error: "Cannot delete a booked slot" }, { status: 400 })

    const { error } = await server.from("expert_service_slots").delete().eq("id", slotId).eq("expert_service_id", serviceId)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("admin expert slot DELETE", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to delete slot" }, { status })
  }
}
