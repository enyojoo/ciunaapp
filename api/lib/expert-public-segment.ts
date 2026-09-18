/** Prefer slug for public `/experts/...` URLs; fall back to id when unset (legacy rows). */
export function expertsPublicUrlSegment(profile: { id: string; slug?: string | null }): string {
  const s = typeof profile.slug === "string" ? profile.slug.trim() : ""
  return s || profile.id
}
