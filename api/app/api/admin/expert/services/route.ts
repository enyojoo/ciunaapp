import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAdmin } from "@/lib/admin-auth-utils"

const SERVICE_SELECT =
  "id, expert_profile_id, title, short_description, sort_order, is_published, fulfillment_type, pricing_type, hourly_rate, hourly_currency, fixed_amount, fixed_currency, package_label, default_duration_minutes, min_session_minutes, max_session_minutes, created_at, updated_at"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)
    const server = createServerClient()
    const { data: services, error } = await server
      .from("expert_services")
      .select(SERVICE_SELECT)
      .order("updated_at", { ascending: false })
      .limit(500)
    if (error) throw error
    const list = services || []
    const profileIds = [...new Set(list.map((s) => s.expert_profile_id).filter(Boolean))] as string[]
    let profilesById: Record<string, { id: string; display_name: string; slug: string | null }> = {}
    if (profileIds.length > 0) {
      const { data: profs, error: pe } = await server
        .from("expert_profiles")
        .select("id, display_name, slug")
        .in("id", profileIds)
      if (pe) throw pe
      for (const p of profs || []) {
        const row = p as { id: string; display_name: string; slug: string | null }
        profilesById[row.id] = {
          id: row.id,
          display_name: String(row.display_name || ""),
          slug: row.slug != null ? String(row.slug) : null,
        }
      }
    }
    const enriched = list.map((s) => ({
      ...s,
      expert_profile: profilesById[String(s.expert_profile_id)] ?? null,
    }))
    return NextResponse.json({ services: enriched })
  } catch (e) {
    console.error("admin expert services list GET", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to load expert services" }, { status })
  }
}
