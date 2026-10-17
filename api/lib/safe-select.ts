/**
 * Public reads must work on a database that has not had the newest migrations applied yet.
 * `safeSelect` runs a query with the full column list; when Postgres/PostgREST says a column or table is missing it
 * retries once with the known-new columns stripped, and remembers that for a minute so later calls skip the failing attempt.
 * New fields simply appear in responses once the SQL is applied.
 */

/** Columns added by supabase/migrations/20261016*.sql and 20261017*.sql; safe to drop from a select. */
export const NEW_COLUMNS = [
  "rating_avg",
  "rating_count",
  "merchant_id",
  "translations",
  "gallery",
  "review_status",
  "review_note",
  "review_requested_at",
  "review_assigned_to",
  "review_claimed_at",
  "reviewed_by",
  "reviewed_at",
  "review_reason_key",
  "claimed_at",
  // 20261017140000_storefront_details.sql
  "opening_hours",
  "time_zone",
  "min_order_amount",
  "min_order_currency",
  "cover_url",
  "verification_tier",
  "eta_minutes",
  "languages",
  "credentials",
  "years_experience",
  // 20261019120000_store_pause.sql
  "is_paused",
  // 20261019180000_expert_main_category.sql
  "main_category",
] as const

const MISSING_CODES = new Set(["42703", "42P01", "PGRST204", "PGRST205"])
const TTL_MS = 60_000

export type DbError = { code?: string; message?: string } | null | undefined

export function isMissingSchemaError(error: DbError): boolean {
  if (!error) return false
  if (error.code && MISSING_CODES.has(error.code)) return true
  return /column .* does not exist|relation .* does not exist|could not find .* column|schema cache/i.test(String(error.message || ""))
}

/** Removes known-new columns from a comma-separated select list. `*` and unknown names are kept. */
export function stripNewColumns(cols: string, extra: readonly string[] = []): string {
  const drop = new Set<string>([...NEW_COLUMNS, ...extra])
  return cols
    .split(",")
    .map((c) => c.trim())
    .filter((c) => c && !drop.has(c.split(/[\s:]/)[0]))
    .join(", ")
}

const degraded = new Map<string, number>()

/** Test hook. */
export function resetSafeSelectCache() {
  degraded.clear()
}

/**
 * @param key   capability key, usually the table name
 * @param cols  full column list including new columns
 * @param build builds the query for a given column list (filters must only use base columns)
 */
export async function safeSelect<R extends { data: any; error: any }>(
  key: string,
  cols: string,
  build: (cols: string) => PromiseLike<R>,
  now = Date.now(),
  /** Columns that are new on this table only (not droppable everywhere), e.g. expert_profiles.is_verified. */
  extraNew: readonly string[] = [],
): Promise<R> {
  const base = stripNewColumns(cols, extraNew)
  const until = degraded.get(key)
  if (until && until > now && base !== cols) return build(base)
  const first = await build(cols)
  if (!isMissingSchemaError(first.error) || base === cols) return first
  degraded.set(key, now + TTL_MS)
  return build(base)
}
