import type { SupabaseClient } from "@supabase/supabase-js"

export type ExpertPricingType = "hourly" | "fixed" | "quote"

export type ExpertFulfillmentType = "online" | "in_person" | "both"

export function parseExpertFulfillment(v: unknown): ExpertFulfillmentType {
  const s = String(v ?? "online")
    .trim()
    .toLowerCase()
  if (s === "in_person" || s === "both") return s
  return "online"
}

export function normalizeExpertPricingType(v: unknown): ExpertPricingType | null {
  const s = String(v || "")
    .trim()
    .toLowerCase()
  if (s === "hourly" || s === "fixed" || s === "quote") return s
  return null
}

export function buildExpertServiceRow(body: Record<string, unknown>): {
  row: Record<string, unknown>
  error?: string
} {
  const pricingType = normalizeExpertPricingType(body.pricing_type) ?? "quote"
  const title = String(body.title || "").trim()
  if (!title) return { row: {}, error: "title required" }

  const row: Record<string, unknown> = {
    title,
    booking_lead_minutes: Number(body.booking_lead_minutes ?? 120),
    payment_cutoff_minutes: Number(body.payment_cutoff_minutes ?? 60),
    meeting_instructions: String(body.meeting_instructions || ""),
    timezone: String(body.timezone || "UTC"),
    short_description: body.short_description != null ? String(body.short_description).trim() || null : null,
    sort_order: body.sort_order != null ? Number(body.sort_order) || 0 : 0,
    is_published: Boolean(body.is_published),
    fulfillment_type: parseExpertFulfillment(body.fulfillment_type),
    pricing_type: pricingType,
    hourly_rate: null,
    hourly_currency: null,
    fixed_amount: null,
    fixed_currency: null,
    package_label: body.package_label != null ? String(body.package_label).trim() || null : null,
    default_duration_minutes:
      body.default_duration_minutes != null ? Number(body.default_duration_minutes) : null,
    min_session_minutes: body.min_session_minutes != null ? Number(body.min_session_minutes) : null,
    max_session_minutes: body.max_session_minutes != null ? Number(body.max_session_minutes) : null,
    updated_at: new Date().toISOString(),
  }

  if (
    ![row.booking_lead_minutes, row.payment_cutoff_minutes].every(
      (v) => Number.isInteger(v) && Number(v) >= 0,
    )
  )
    return { row: {}, error: "Invalid booking timing" }
  try {
    new Intl.DateTimeFormat("en", { timeZone: String(row.timezone) })
  } catch {
    return { row: {}, error: "Invalid timezone" }
  }
  for (const k of ["default_duration_minutes", "min_session_minutes", "max_session_minutes"])
    if (row[k] != null && (!Number.isInteger(row[k]) || Number(row[k]) <= 0))
      return { row: {}, error: "Duration must be a positive whole number of minutes" }
  if (
    row.min_session_minutes != null &&
    row.max_session_minutes != null &&
    Number(row.min_session_minutes) > Number(row.max_session_minutes)
  )
    return { row: {}, error: "Minimum duration exceeds maximum duration" }
  if (row.is_published && pricingType === "quote")
    return {
      row: {},
      error: "Quote services cannot be published for online booking. Keep as draft or switch to hourly/fixed pricing.",
    }
  if (row.is_published && !String(row.meeting_instructions).trim())
    return { row: {}, error: "Meeting instructions required before publication" }
  if (pricingType === "quote") {
    row.is_published = false
    return { row }
  }
  if (pricingType === "hourly") {
    const rate = body.hourly_rate != null ? Number(body.hourly_rate) : NaN
    const cur = String(body.hourly_currency || "")
      .trim()
      .toUpperCase()
    if (!Number.isFinite(rate) || rate <= 0) return { row: {}, error: "hourly_rate required" }
    if (!/^[A-Z]{3}$/.test(cur)) return { row: {}, error: "hourly_currency required" }
    row.hourly_rate = rate
    row.hourly_currency = cur
    return { row }
  }
  const amt = body.fixed_amount != null ? Number(body.fixed_amount) : NaN
  const fcur = String(body.fixed_currency || "")
    .trim()
    .toUpperCase()
  if (!Number.isFinite(amt) || amt <= 0) return { row: {}, error: "fixed_amount required" }
  if (!/^[A-Z]{3}$/.test(fcur)) return { row: {}, error: "fixed_currency required" }
  row.fixed_amount = amt
  row.fixed_currency = fcur
  return { row }
}

export async function assertSlotBelongsToService(
  server: SupabaseClient,
  serviceId: string,
  slotId: string,
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const { data, error } = await server
    .from("expert_service_slots")
    .select("id")
    .eq("id", slotId)
    .eq("expert_service_id", serviceId)
    .maybeSingle()
  if (error || !data) return { ok: false, status: 404, message: "slot not found for service" }
  return { ok: true }
}
