/**
 * Cache-Control values for expert public APIs and `/experts/*` pages.
 *
 * - Catalog aggregates (profiles list, services catalog, profile detail) can use short shared CDN cache + SWR.
 * - Slot availability and booking payloads are time-sensitive and user-specific — never store at shared caches.
 */

/** Published catalog JSON (lists + profile services): brief CDN cache, background revalidation. */
export const EXPERT_CATALOG_JSON_CACHE_CONTROL = "public, max-age=120, stale-while-revalidate=300"

/** Slot lists / slot preflight — availability changes minute-to-minute; auth-aware. */
export const EXPERT_SLOTS_JSON_CACHE_CONTROL = "private, no-store, must-revalidate"
