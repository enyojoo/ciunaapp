import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAdmin } from "@/lib/admin-auth-utils"

/** Join profile, service, and slot for Office list; nullable FKs return null embeds. */
const BOOKING_LIST_SELECT = `
  *,
  expert_profiles ( id, display_name, category ),
  expert_services ( id, title, pricing_type ),
  expert_service_slots ( id, slot_start, slot_end, status )
`

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const expertProfileId = (searchParams.get("expert_profile_id") || "").trim()
    const expertServiceId = (searchParams.get("expert_service_id") || "").trim()

    const server = createServerClient()
    let q = server.from("expert_bookings").select(BOOKING_LIST_SELECT).order("created_at", { ascending: false }).limit(500)
    if (expertProfileId) {
      q = q.eq("expert_profile_id", expertProfileId)
    }
    if (expertServiceId) {
      q = q.eq("expert_service_id", expertServiceId)
    }
    const { data, error } = await q

    if (error) throw error
    return NextResponse.json({ bookings: data || [] })
  } catch (e) {
    console.error("admin expert bookings GET", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to load bookings" }, { status })
  }
}
