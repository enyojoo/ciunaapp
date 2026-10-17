import { openState, type Schedule } from "./hours"

/** Public storefront fields derived from a hub_vendors row: hours state, minimum order, cover, verification tier. */
export function storefrontFields(row: Record<string, any>, now: Date = new Date()) {
  const schedule = (row.opening_hours && typeof row.opening_hours === "object" && !Array.isArray(row.opening_hours) ? row.opening_hours : {}) as Schedule
  const timeZone = typeof row.time_zone === "string" && row.time_zone ? row.time_zone : "UTC"
  const state = openState(schedule, timeZone, now)
  // A paused store is closed to orders whatever its hours say.
  const paused = row.is_paused === true
  return {
    opening_hours: schedule,
    time_zone: timeZone,
    is_paused: paused,
    hours_configured: paused || state.configured,
    is_open: paused ? false : state.open,
    opens_at: paused ? null : state.opensAt ?? null,
    closes_at: paused ? null : state.closesAt ?? null,
    min_order_amount: row.min_order_amount != null ? Number(row.min_order_amount) : null,
    min_order_currency: row.min_order_currency ? String(row.min_order_currency) : null,
    cover_url: row.cover_url ? String(row.cover_url) : null,
    verification_tier: Number(row.verification_tier) || (row.is_verified ? 1 : 0),
  }
}

export type Credential = { title: string; issuer?: string; year?: number }

/** Public expert fields: spoken languages, time zone, credentials, years of practice, verification. */
export function expertFields(row: Record<string, any>) {
  const credentials: Credential[] = Array.isArray(row.credentials)
    ? row.credentials
        .filter((c: any) => c && typeof c.title === "string" && c.title.trim())
        .slice(0, 10)
        .map((c: any) => ({
          title: String(c.title).trim().slice(0, 120),
          ...(c.issuer ? { issuer: String(c.issuer).trim().slice(0, 120) } : {}),
          ...(Number.isFinite(Number(c.year)) ? { year: Number(c.year) } : {}),
        }))
    : []
  return {
    languages: Array.isArray(row.languages) ? row.languages.map(String) : [],
    time_zone: typeof row.time_zone === "string" && row.time_zone ? row.time_zone : "UTC",
    credentials,
    years_experience: row.years_experience != null ? Number(row.years_experience) : null,
    is_verified: Boolean(row.is_verified),
    verification_tier: Number(row.verification_tier) || (row.is_verified ? 1 : 0),
  }
}

/**
 * Set when a store has opening hours and is closed right now (orders are blocked until it opens).
 * A store with no hours is never closed. `opensAt` is in the store's own time zone.
 */
export function storeClosedState(row: Record<string, any> | null | undefined, now: Date = new Date()): { opensAt?: { day: string; time: string }; paused?: true } | undefined {
  if (!row) return undefined
  const f = storefrontFields(row, now)
  if (f.is_paused) return { paused: true }
  if (!f.hours_configured || f.is_open) return undefined
  return f.opens_at ? { opensAt: f.opens_at } : {}
}
