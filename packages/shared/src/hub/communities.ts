/**
 * Communities a store can serve ("food from home"). A store picks up to MAX_STORE_COMMUNITIES; shoppers filter Food and
 * Mart by one. Ids are stored on `merchants.communities` / `hub_vendors.communities`; labels live in the app locales under
 * `hub.community.<id>`. To add one: add the id here, in the SQL check constraint (see
 * supabase/migrations/20261020100000_store_communities.sql), and a label in each locale.
 */
export const COMMUNITY_IDS = [
  "nigerian",
  "african",
  "chinese",
  "indian",
  "arab",
  "latin_american",
  "turkish",
  "vietnamese",
  "korean",
  "central_asian",
] as const

export type CommunityId = (typeof COMMUNITY_IDS)[number]

export const MAX_STORE_COMMUNITIES = 5

export function isCommunityId(v: unknown): v is CommunityId {
  return typeof v === "string" && (COMMUNITY_IDS as readonly string[]).includes(v)
}

/** Keeps only known ids, once each, in the order given, capped at MAX_STORE_COMMUNITIES. */
export function cleanCommunities(v: unknown): CommunityId[] {
  if (!Array.isArray(v)) return []
  return [...new Set(v.filter(isCommunityId))].slice(0, MAX_STORE_COMMUNITIES)
}
