import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAdmin } from "@/lib/admin-auth-utils"
import type { WeeklyRuleInput } from "@/lib/expert-schedule-materialize"
import { toDate } from "date-fns-tz"

const SCHEDULE_SELECT =
  "id, expert_service_id, timezone, window_start_date, window_end_date, slot_duration_minutes, created_at, updated_at"
const RULE_SELECT = "id, schedule_id, day_of_week, local_start_time, local_end_time, sort_order"

function validateTimezone(tz: string): boolean {
  try {
    toDate("2020-01-01 12:00:00", { timeZone: tz.trim() })
    return true
  } catch {
    return false
  }
}

function parseRules(body: unknown): WeeklyRuleInput[] | { error: string } {
  if (!Array.isArray(body)) return { error: "weekly_rules must be an array" }
  const out: WeeklyRuleInput[] = []
  for (const raw of body) {
    if (!raw || typeof raw !== "object") return { error: "invalid weekly_rules entry" }
    const o = raw as Record<string, unknown>
    const dow = Math.floor(Number(o.day_of_week))
    if (dow < 0 || dow > 6) return { error: "day_of_week must be 0–6 (Sun–Sat)" }
    const ls = String(o.local_start_time || "").trim()
    const le = String(o.local_end_time || "").trim()
    if (!ls || !le) return { error: "local_start_time and local_end_time required" }
    out.push({
      day_of_week: dow,
      local_start_time: ls,
      local_end_time: le,
      sort_order: o.sort_order != null ? Number(o.sort_order) || 0 : 0,
    })
  }
  return out
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) {
  try {
    await requireAdmin(request)
    const { serviceId } = await params
    if (!serviceId) return NextResponse.json({ error: "Missing serviceId" }, { status: 400 })
    const server = createServerClient()
    const { data: svc, error: se } = await server.from("expert_services").select("id").eq("id", serviceId).maybeSingle()
    if (se || !svc) return NextResponse.json({ error: "Service not found" }, { status: 404 })

    const { data: schedule, error: schErr } = await server
      .from("expert_service_schedules")
      .select(SCHEDULE_SELECT)
      .eq("expert_service_id", serviceId)
      .maybeSingle()
    if (schErr) throw schErr
    if (!schedule) return NextResponse.json({ schedule: null, weekly_rules: [] })

    const { data: rules, error: rErr } = await server
      .from("expert_service_weekly_rules")
      .select(RULE_SELECT)
      .eq("schedule_id", schedule.id)
      .order("day_of_week", { ascending: true })
      .order("sort_order", { ascending: true })
    if (rErr) throw rErr
    return NextResponse.json({ schedule, weekly_rules: rules || [] })
  } catch (e) {
    console.error("admin expert schedule GET", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to load schedule" }, { status })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) {
  try {
    await requireAdmin(request)
    const { serviceId } = await params
    if (!serviceId) return NextResponse.json({ error: "Missing serviceId" }, { status: 400 })
    const body = await request.json().catch(() => ({}))
    const server = createServerClient()
    const { data: svc, error: se } = await server.from("expert_services").select("id").eq("id", serviceId).maybeSingle()
    if (se || !svc) return NextResponse.json({ error: "Service not found" }, { status: 404 })

    const timezone = String(body.timezone || "").trim()
    if (!timezone) return NextResponse.json({ error: "timezone required" }, { status: 400 })
    if (!validateTimezone(timezone)) return NextResponse.json({ error: "invalid timezone" }, { status: 400 })

    const windowStart = String(body.window_start_date || "").trim()
    const windowEnd = String(body.window_end_date || "").trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(windowStart) || !/^\d{4}-\d{2}-\d{2}$/.test(windowEnd)) {
      return NextResponse.json({ error: "window_start_date and window_end_date must be YYYY-MM-DD" }, { status: 400 })
    }
    if (windowEnd < windowStart) return NextResponse.json({ error: "window_end_date must be >= window_start_date" }, { status: 400 })

    const slotDur =
      body.slot_duration_minutes != null && body.slot_duration_minutes !== ""
        ? Number(body.slot_duration_minutes)
        : null
    if (slotDur != null && (!Number.isFinite(slotDur) || slotDur <= 0)) {
      return NextResponse.json({ error: "slot_duration_minutes must be positive or null" }, { status: 400 })
    }

    const parsed = parseRules(body.weekly_rules)
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

    const nowIso = new Date().toISOString()

    const { data: existing, error: exErr } = await server
      .from("expert_service_schedules")
      .select("id")
      .eq("expert_service_id", serviceId)
      .maybeSingle()
    if (exErr) throw exErr

    let scheduleId = existing?.id as string | undefined
    if (scheduleId) {
      const { error: upErr } = await server
        .from("expert_service_schedules")
        .update({
          timezone,
          window_start_date: windowStart,
          window_end_date: windowEnd,
          slot_duration_minutes: slotDur,
          updated_at: nowIso,
        })
        .eq("id", scheduleId)
      if (upErr) throw upErr
      await server.from("expert_service_weekly_rules").delete().eq("schedule_id", scheduleId)
    } else {
      const { data: inserted, error: insErr } = await server
        .from("expert_service_schedules")
        .insert({
          expert_service_id: serviceId,
          timezone,
          window_start_date: windowStart,
          window_end_date: windowEnd,
          slot_duration_minutes: slotDur,
          updated_at: nowIso,
        })
        .select("id")
        .single()
      if (insErr || !inserted) throw insErr
      scheduleId = inserted.id as string
    }

    if (parsed.length > 0) {
      const rows = parsed.map((r) => ({
        schedule_id: scheduleId,
        day_of_week: r.day_of_week,
        local_start_time: r.local_start_time,
        local_end_time: r.local_end_time,
        sort_order: r.sort_order,
      }))
      const { error: rIns } = await server.from("expert_service_weekly_rules").insert(rows)
      if (rIns) throw rIns
    }

    const { data: schedule, error: sErr } = await server
      .from("expert_service_schedules")
      .select(SCHEDULE_SELECT)
      .eq("id", scheduleId!)
      .single()
    if (sErr) throw sErr
    const { data: rules, error: lrErr } = await server
      .from("expert_service_weekly_rules")
      .select(RULE_SELECT)
      .eq("schedule_id", scheduleId!)
      .order("day_of_week", { ascending: true })
      .order("sort_order", { ascending: true })
    if (lrErr) throw lrErr

    return NextResponse.json({ schedule, weekly_rules: rules || [] })
  } catch (e) {
    console.error("admin expert schedule PATCH", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to save schedule" }, { status })
  }
}
