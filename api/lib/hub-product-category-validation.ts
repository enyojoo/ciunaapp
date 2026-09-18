import type { SupabaseClient } from "@supabase/supabase-js"
import { hubCategorySlug } from "@/lib/hub-slug"

export async function assertHubProductCategoryAllowed(
  server: SupabaseClient,
  category: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const slug = hubCategorySlug(category)
  if (!slug) {
    return { ok: false, message: "Product category must map to a hub service slug (e.g. Connectivity → connectivity)." }
  }
  const { data, error } = await server
    .from("hub_service_lines")
    .select("id")
    .eq("slug", slug)
    .eq("grid_kind", "hub_category")
    .maybeSingle()

  if (error) {
    console.error("hub category validation", error)
    return { ok: false, message: "Could not validate category" }
  }
  if (!data) {
    return {
      ok: false,
      message: `Unknown hub category "${category}". Add or enable a Hub service line with slug "${slug}" (grid: marketplace category), or pick an existing line.`,
    }
  }
  return { ok: true }
}
