import { openState, type Schedule } from "./hours"

/** Public storefront fields derived from a hub_vendors row: hours state, minimum order, cover, verification tier. */
export function storefrontFields(row: Record<string, any>, now: Date = new Date()) {
  const schedule = (row.opening_hours && typeof row.opening_hours === "object" && !Array.isArray(row.opening_hours) ? row.opening_hours : {}) as Schedule
  const timeZone = typeof row.time_zone === "string" && row.time_zone ? row.time_zone : "UTC"
  const state = openState(schedule, timeZone, now)
  return {
    opening_hours: schedule,
    time_zone: timeZone,
    hours_configured: state.configured,
    is_open: state.open,
    opens_at: state.opensAt ?? null,
    closes_at: state.closesAt ?? null,
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
