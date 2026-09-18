import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAuth, withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { EXPERT_SLOTS_JSON_CACHE_CONTROL } from "@/lib/expert-http-cache"

export const GET = withErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) => {
  try {
    await requireAuth(request)
  } catch {
    return createErrorResponse("Unauthorized", 401)
  }

  const { serviceId } = await params
  if (!serviceId) return createErrorResponse("Missing serviceId", 400)

  const server = createServerClient()
  const nowIso = new Date().toISOString()
  const { data: svc, error: se } = await server
    .from("expert_services")
    .select("id, is_published, expert_profile_id")
    .eq("id", serviceId)
    .maybeSingle()

  if (se || !svc) return createErrorResponse("Not found", 404)
  if (!svc.is_published) return createErrorResponse("Not found", 404)

  const { data: prof, error: pe } = await server
    .from("expert_profiles")
    .select("is_published")
    .eq("id", svc.expert_profile_id)
    .maybeSingle()
  if (pe || !prof?.is_published) return createErrorResponse("Not found", 404)

  const { data, error } = await server
    .from("expert_service_slots")
    .select("id, slot_start, slot_end, status")
    .eq("expert_service_id", serviceId)
    .eq("status", "available")
    .gt("slot_start", nowIso)
    .order("slot_start", { ascending: true })

  if (error) {
    console.error("expert public slots", error)
    return createErrorResponse("Failed to load slots", 500)
  }

  const res = NextResponse.json({ slots: data || [] })
  res.headers.set("Cache-Control", EXPERT_SLOTS_JSON_CACHE_CONTROL)
  return res
})
