import { isHubProductMainCategory } from "@ciuna/shared"
import { isMissingSchemaError, type DbError } from "@/lib/safe-select"

/**
 * Reads `main_category` from a request body for a product on `line`. Returns `undefined` when the body does not
 * mention it (leave the column alone), `null` to clear it, the id when valid, or `"invalid"` when it is not one of
 * the line's categories.
 */
export function readProductMainCategory(line: string | null | undefined, body: Record<string, unknown>): string | null | undefined | "invalid" {
  if (!("main_category" in body)) return undefined
  const v = body.main_category
  if (v == null || v === "") return null
  return isHubProductMainCategory(line, v) ? (v as string) : "invalid"
}

/**
 * Runs an insert or update that may carry `main_category`. Before product-main-category.sql has run the column does
 * not exist: retry once without it so everything else still saves.
 */
export async function withProductMainCategoryFallback<R extends { error: DbError }>(
  row: Record<string, unknown>,
  run: (row: Record<string, unknown>) => PromiseLike<R>,
): Promise<R> {
  const first = await run(row)
  if (!("main_category" in row) || !isMissingSchemaError(first.error)) return first
  const { main_category: _dropped, ...rest } = row
  return run(rest)
}
