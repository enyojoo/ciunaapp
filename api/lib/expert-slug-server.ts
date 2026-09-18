import { normalizePublicSlug } from "@ciuna/shared"
import type { SupabaseClient } from "@supabase/supabase-js"

/** Returns a unique normalized slug; prefers `preferred` (e.g. display name or typed slug). */
export async function allocateExpertSlug(
  server: SupabaseClient,
  preferred: string,
  excludeProfileId?: string,
): Promise<string> {
  let base = normalizePublicSlug(preferred)
  if (!base) base = "expert"
  for (let i = 0; i < 100; i++) {
    const candidate = i === 0 ? base : `${base}-${i}`
    /** Use limit() instead of maybeSingle(): duplicate slug rows would make maybeSingle() throw (PGRST116). */
    const { data: rows, error } = await server.from("expert_profiles").select("id").eq("slug", candidate).limit(3)
    if (error) throw error
    if (!rows?.length) return candidate
    const occupantId = String(rows[0].id || "")
    if (excludeProfileId && occupantId === excludeProfileId) return candidate
  }
  throw new Error("slug_alloc_failed")
}
