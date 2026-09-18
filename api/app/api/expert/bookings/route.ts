import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireUser, withErrorHandling, createErrorResponse } from "@/lib/auth-utils"

export const GET = withErrorHandling(async (request: NextRequest) => {
  let user
  try {
    user = await requireUser(request)
  } catch {
    return createErrorResponse("Unauthorized", 401)
  }

  const server = createServerClient()
  const { data, error } = await server
    .from("expert_bookings")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("expert bookings list", error)
    return createErrorResponse("Failed to load bookings", 500)
  }

  return NextResponse.json({ bookings: data || [] })
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  let user
  try {
    user = await requireUser(request)
  } catch {
    return createErrorResponse("Unauthorized", 401)
  }

  const body = await request.json().catch(() => ({}))
  const slotId = String(body.expert_service_slot_id || "").trim()
  const message = body.message != null ? String(body.message) : null

  const server = createServerClient()
  const nowIso = new Date().toISOString()

  if (slotId) {
    const { data: slot, error: slotErr } = await server
      .from("expert_service_slots")
      .select("id, slot_start, slot_end, status, expert_service_id")
      .eq("id", slotId)
      .maybeSingle()

    if (slotErr || !slot) return createErrorResponse("Slot not found", 404)
    const startMs = new Date(String(slot.slot_start)).getTime()
    const endMs = new Date(String(slot.slot_end)).getTime()
    const nowMs = Date.now()
    if (slot.status !== "available" || startMs <= nowMs || endMs <= nowMs) {
      return createErrorResponse("Slot not available", 409)
    }

    const { data: svc, error: sErr } = await server
      .from("expert_services")
      .select("id, expert_profile_id, pricing_type, is_published")
      .eq("id", slot.expert_service_id)
      .maybeSingle()
    if (sErr || !svc?.is_published) return createErrorResponse("Service not found", 404)

    const { data: prof, error: pErr } = await server
      .from("expert_profiles")
      .select("id, is_published")
      .eq("id", svc.expert_profile_id)
      .maybeSingle()
    if (pErr || !prof?.is_published) return createErrorResponse("Expert not found", 404)

    const { data: locked, error: lockErr } = await server
      .from("expert_service_slots")
      .update({ status: "booked", updated_at: new Date().toISOString() })
      .eq("id", slotId)
      .eq("status", "available")
      .select("id")
      .maybeSingle()

    if (lockErr || !locked) return createErrorResponse("Slot just taken", 409)

    const row = {
      user_id: user.id,
      expert_profile_id: svc.expert_profile_id,
      expert_service_id: svc.id,
      expert_service_slot_id: slotId,
      pricing_type_snapshot: svc.pricing_type,
      status: "pending",
      slot_start: slot.slot_start,
      slot_end: slot.slot_end,
      message,
      updated_at: new Date().toISOString(),
    }

    const { data: booking, error: insErr } = await server.from("expert_bookings").insert(row).select("*").single()
    if (insErr || !booking) {
      await server
        .from("expert_service_slots")
        .update({ status: "available", updated_at: new Date().toISOString() })
        .eq("id", slotId)
      console.error("expert bookings create", insErr)
      return createErrorResponse("Failed to create booking", 500)
    }

    return NextResponse.json({ booking })
  }

  const expertProfileId = String(body.expert_profile_id || "").trim()
  if (!expertProfileId) {
    return createErrorResponse("expert_service_slot_id or expert_profile_id required", 400)
  }

  const { data: prof, error: pErr } = await server
    .from("expert_profiles")
    .select("id")
    .eq("id", expertProfileId)
    .eq("is_published", true)
    .maybeSingle()
  if (pErr || !prof) {
    return createErrorResponse("Expert not found", 404)
  }

  const row = {
    user_id: user.id,
    expert_profile_id: expertProfileId,
    status: "pending",
    slot_start: body.slot_start ? String(body.slot_start) : null,
    slot_end: body.slot_end ? String(body.slot_end) : null,
    message,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await server.from("expert_bookings").insert(row).select("*").single()
  if (error) {
    console.error("expert bookings create", error)
    return createErrorResponse("Failed to create booking", 500)
  }

  return NextResponse.json({ booking: data })
})
