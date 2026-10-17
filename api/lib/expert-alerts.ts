import { createServerClient } from "@/lib/supabase"
import { nextAvailable } from "@/lib/expert-availability"
import { isUuidLike, normalizePublicSlug } from "@ciuna/shared"
import { MerchantError } from "@/lib/merchant/errors"

/** Resolves a published expert by slug or id. */
export async function publishedProfileId(segment: string): Promise<string> {
  const raw = decodeURIComponent(String(segment || "").trim())
  const q = createServerClient().from("expert_profiles").select("id").eq("is_published", true)
  const { data } = await (isUuidLike(raw) ? q.eq("id", raw) : q.eq("slug", normalizePublicSlug(raw))).maybeSingle()
  if (!data) throw new MerchantError("EXPERT_NOT_FOUND", 404)
  return String((data as { id: string }).id)
}

/** The earliest bookable time for each expert (same rule as the directory card). */
export async function nextAvailableFor(profileIds: string[]): Promise<Map<string, string>> {
  if (!profileIds.length) return new Map()
  const db = createServerClient()
  const { data: services } = await db.from("expert_services").select("id, expert_profile_id, booking_lead_minutes").in("expert_profile_id", profileIds).eq("is_published", true)
  const svc = (services as any[]) || []
  if (!svc.length) return new Map()
  const { data: slots } = await db.from("expert_service_slots").select("expert_service_id, slot_start").in("expert_service_id", svc.map((s) => s.id)).eq("status", "available").gt("slot_start", new Date().toISOString()).order("slot_start", { ascending: true }).limit(3000)
  return nextAvailable((slots as any[]) || [], svc)
}
