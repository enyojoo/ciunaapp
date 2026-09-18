import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAdmin } from "@/lib/admin-auth-utils"
import { computeMaterializedSlots, type WeeklyRuleInput } from "@/lib/expert-schedule-materialize"

const SCHEDULE_SELECT =
  "id, expert_service_id, timezone, window_start_date, window_end_date, slot_duration_minutes, created_at, updated_at"
const RULE_SELECT = "id, schedule_id, day_of_week, local_start_time, local_end_time, sort_order"

export async function POST(request: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) {
  try {
    await requireAdmin(request)
    const { serviceId } = await params
    if (!serviceId) return NextResponse.json({ error: "Missing serviceId" }, { status: 400 })
    const server = createServerClient()

    const { data: svc, error: se } = await server
      .from("expert_services")
      .select("id, default_duration_minutes")
      .eq("id", serviceId)
      .maybeSingle()
    if (se || !svc) return NextResponse.json({ error: "Service not found" }, { status: 404 })

    const { data: schedule, error: schErr } = await server
      .from("expert_service_schedules")
      .select(SCHEDULE_SELECT)
      .eq("expert_service_id", serviceId)
      .maybeSingle()
    if (schErr) throw schErr
    if (!schedule) return NextResponse.json({ error: "Save a schedule first" }, { status: 400 })

    const { data: rules, error: rErr } = await server
      .from("expert_service_weekly_rules")
      .select(RULE_SELECT)
      .eq("schedule_id", schedule.id)
      .order("day_of_week", { ascending: true })
      .order("sort_order", { ascending: true })
    if (rErr) throw rErr
    const weeklyRules = (rules || []) as WeeklyRuleInput[]
    if (weeklyRules.length === 0) return NextResponse.json({ error: "Add at least one weekly rule" }, { status: 400 })

    const duration =
      schedule.slot_duration_minutes != null && Number(schedule.slot_duration_minutes) > 0
        ? Number(schedule.slot_duration_minutes)
        : svc.default_duration_minutes != null && Number(svc.default_duration_minutes) > 0
          ? Number(svc.default_duration_minutes)
          : 60

    const { data: booked, error: bErr } = await server
      .from("expert_service_slots")
      .select("slot_start, slot_end")
      .eq("expert_service_id", serviceId)
      .eq("status", "booked")
    if (bErr) throw bErr
    const bookedIntervals = (booked || []).map((r: { slot_start: string; slot_end: string }) => ({
      start: new Date(r.slot_start),
      end: new Date(r.slot_end),
    }))

    const now = new Date()
    const candidates = computeMaterializedSlots({
      windowStartDate: schedule.window_start_date as string,
      windowEndDate: schedule.window_end_date as string,
      timeZone: schedule.timezone as string,
      durationMinutes: duration,
      weeklyRules,
      bookedIntervals,
      now,
    })

    const nowIso = now.toISOString()

    const { error: delErr } = await server
      .from("expert_service_slots")
      .delete()
      .eq("expert_service_id", serviceId)
      .eq("source", "schedule")
      .eq("status", "available")
      .gt("slot_start", nowIso)
    if (delErr) throw delErr

    if (candidates.length === 0) {
      return NextResponse.json({ inserted: 0, schedule })
    }

    const rows = candidates.map((c) => ({
      expert_service_id: serviceId,
      slot_start: c.slot_start,
      slot_end: c.slot_end,
      status: "available",
      source: "schedule",
      schedule_id: schedule.id,
      updated_at: nowIso,
    }))

    const chunk = 200
    let inserted = 0
    for (let i = 0; i < rows.length; i += chunk) {
      const slice = rows.slice(i, i + chunk)
      const { error: insErr } = await server.from("expert_service_slots").insert(slice)
      if (insErr) throw insErr
      inserted += slice.length
    }

    return NextResponse.json({ inserted, schedule })
  } catch (e) {
    console.error("admin expert schedule regenerate", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to regenerate slots" }, { status })
  }
}
