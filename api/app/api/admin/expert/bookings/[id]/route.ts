import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAdmin } from "@/lib/admin-auth-utils"

const ALLOWED = new Set(["pending", "confirmed", "cancelled", "completed"])

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request)
    const { id } = await params
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    const body = await request.json().catch(() => ({}))
    const status = String(body.status || "").trim().toLowerCase()
    if (!ALLOWED.has(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 })

    const server = createServerClient()
    const { data: booking, error: be } = await server
      .from("expert_bookings")
      .select("id, expert_service_slot_id, status")
      .eq("id", id)
      .maybeSingle()
    if (be || !booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 })

    const prev = String(booking.status || "")
    const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
    if (body.message !== undefined) patch.message = body.message != null ? String(body.message) : null

    const { data, error } = await server.from("expert_bookings").update(patch).eq("id", id).select("*").single()
    if (error) throw error

    if (status === "cancelled" && booking.expert_service_slot_id && prev !== "cancelled") {
      await server
        .from("expert_service_slots")
        .update({ status: "available", updated_at: new Date().toISOString() })
        .eq("id", booking.expert_service_slot_id)
        .eq("status", "booked")
    }

    return NextResponse.json({ booking: data })
  } catch (e) {
    console.error("admin expert booking PATCH", e)
    const st = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to update booking" }, { status: st })
  }
}
