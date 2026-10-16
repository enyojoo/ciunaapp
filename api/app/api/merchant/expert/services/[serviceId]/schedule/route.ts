import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { check } from "@/lib/merchant/errors"
import { assertServiceOwned, loadSchedule, parseScheduleBody, previewSlots, regenerateSlots, slotDuration } from "@/lib/merchant/expert"
import { audit } from "@/lib/merchant/audit"

export const GET = merchantRoute("availability", async (_req, { merchant }, params) => {
  const service = await assertServiceOwned(merchant.id, params.serviceId, merchant.type)
  const { schedule, weekly_rules } = await loadSchedule(service.id)
  const preview = schedule
    ? previewSlots({ windowStartDate: schedule.window_start_date, windowEndDate: schedule.window_end_date, timeZone: schedule.timezone, durationMinutes: slotDuration(schedule, service), weeklyRules: weekly_rules })
    : []
  return { schedule, weekly_rules, preview }
})

export const PATCH = merchantRoute("availability", async (req, { user, merchant }, params) => {
  const service = await assertServiceOwned(merchant.id, params.serviceId, merchant.type)
  const { timezone, window, slotDur, rules } = parseScheduleBody(await readJson(req))
  const server = createServerClient()
  const nowIso = new Date().toISOString()
  const { data: existing, error: ee } = await server.from("expert_service_schedules").select("id").eq("expert_service_id", service.id).maybeSingle()
  check(ee)
  const fields = { timezone, window_start_date: window.start, window_end_date: window.end, slot_duration_minutes: slotDur, updated_at: nowIso }
  let scheduleId = existing?.id as string | undefined
  if (scheduleId) {
    const { error } = await server.from("expert_service_schedules").update(fields).eq("id", scheduleId)
    check(error)
    const { error: de } = await server.from("expert_service_weekly_rules").delete().eq("schedule_id", scheduleId)
    check(de)
  } else {
    const { data, error } = await server.from("expert_service_schedules").insert({ expert_service_id: service.id, ...fields }).select("id").single()
    check(error)
    scheduleId = data!.id as string
  }
  if (rules.length) {
    const { error } = await server.from("expert_service_weekly_rules").insert(rules.map((r) => ({ schedule_id: scheduleId, ...r })))
    check(error)
  }
  const { inserted, preview } = await regenerateSlots(service)
  const saved = await loadSchedule(service.id)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "expert_schedule.updated", entityType: "expert_service", entityId: service.id, details: { timezone, windowDays: window.days, rules: rules.length, inserted } })
  return { ...saved, inserted, preview }
})
