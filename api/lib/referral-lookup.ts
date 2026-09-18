import type { SupabaseClient } from "@supabase/supabase-js"

const MAX_SLUG_LENGTH = 64

/**
 * Slugs minted by `generateReferralSlug` are alphanumeric. Restricting ILIKE lookups to this shape
 * avoids `_` / `%` being treated as wildcards in Postgres pattern matching.
 */
function isCanonReferralSlugShape(s: string): boolean {
  return s.length >= 8 && s.length <= MAX_SLUG_LENGTH && /^[a-zA-Z0-9]+$/.test(s)
}

/**
 * Resolve a referrer row by referral slug — case-insensitive for `[a-zA-Z0-9]+` URLs (printed links,
 * `?ref=`, cookies). Falls back to exact match for uncommon shapes.
 */
export async function findReferrerRowBySlug(
  supabase: Pick<SupabaseClient, "from">,
  slug: string
): Promise<{ id: string } | null> {
  const s = slug.trim()
  if (!s || s.length > MAX_SLUG_LENGTH) return null

  if (isCanonReferralSlugShape(s)) {
    const { data, error } = await supabase.from("users").select("id").ilike("referral_slug", s).maybeSingle()
    if (!error && data?.id) return data
  }

  const { data: exact, error: exactErr } = await supabase.from("users").select("id").eq("referral_slug", s).maybeSingle()
  if (!exactErr && exact?.id) return exact

  return null
}
