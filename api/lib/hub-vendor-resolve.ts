import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Resolve a published vendor by URL slug for Food/Mart. Prefers an explicit
 * `service_line_slug` match; otherwise accepts a single legacy row with a null line.
 */
export async function getPublishedHubVendorForLine(
  server: SupabaseClient,
  vendorSlug: string,
  serviceLine: "food" | "mart",
): Promise<{ row: Record<string, unknown> | null; error: Error | null }> {
  const slug = vendorSlug.trim().toLowerCase()
  const line = serviceLine

  const { data: rows, error } = await server.from("hub_vendors").select("*").eq("slug", slug).eq("is_published", true)

  if (error) return { row: null, error }
  const list = (rows || []) as Record<string, unknown>[]
  const exact = list.find((v) => String(v.service_line_slug || "").trim().toLowerCase() === line)
  if (exact) return { row: exact, error: null }

  const legacy = list.filter((v) => v.service_line_slug == null || String(v.service_line_slug).trim() === "")
  if (legacy.length === 1) return { row: legacy[0], error: null }

  return { row: null, error: null }
}
