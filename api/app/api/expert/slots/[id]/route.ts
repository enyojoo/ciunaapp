import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAuth, withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { EXPERT_SLOTS_JSON_CACHE_CONTROL } from "@/lib/expert-http-cache"

export const GET = withErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await requireAuth(request)
  } catch {
    return createErrorResponse("Unauthorized", 401)
  }

  const { id } = await params
  if (!id) return createErrorResponse("Missing id", 400)

  const server = createServerClient()
  const nowIso = new Date().toISOString()

  const { data: slot, error: se } = await server
    .from("expert_service_slots")
    .select("id, slot_start, slot_end, status, expert_service_id")
    .eq("id", id)
    .maybeSingle()

  if (se || !slot) return createErrorResponse("Not found", 404)
  const startMs = new Date(String(slot.slot_start)).getTime()
  const endMs = new Date(String(slot.slot_end)).getTime()
  const nowMs = Date.now()
  if (slot.status !== "available" || startMs <= nowMs || endMs <= nowMs) {
    return createErrorResponse("Slot not available", 404)
  }

  const { data: svc, error: ve } = await server
    .from("expert_services")
    .select(
      "id, title, short_description, pricing_type, hourly_rate, hourly_currency, fixed_amount, fixed_currency, package_label, expert_profile_id, is_published",
    )
    .eq("id", slot.expert_service_id)
    .maybeSingle()
  if (ve || !svc?.is_published) return createErrorResponse("Not found", 404)

  const { data: profile, error: pe } = await server
    .from("expert_profiles")
    .select("id, slug, display_name, headline, image_url, is_published")
    .eq("id", svc.expert_profile_id)
    .maybeSingle()
  if (pe || !profile?.is_published) return createErrorResponse("Not found", 404)

  const res = NextResponse.json({ slot, service: svc, profile })
  res.headers.set("Cache-Control", EXPERT_SLOTS_JSON_CACHE_CONTROL)
  return res
})
