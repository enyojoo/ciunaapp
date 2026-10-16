export class MerchantError extends Error {
  constructor(
    public code: string,
    public status = 400,
    public details?: Record<string, unknown>,
  ) {
    super(code)
    this.name = "MerchantError"
  }
}

export function assert(condition: unknown, code: string, status = 400, details?: Record<string, unknown>): asserts condition {
  if (!condition) throw new MerchantError(code, status, details)
}

/** Throws a MerchantError for a Supabase error, hiding internals from the client. */
export function check(error: { message: string; code?: string } | null, code = "DATABASE_ERROR") {
  if (!error) return
  console.error("merchant db error", error.code, error.message)
  throw new MerchantError(code, error.code === "23505" ? 409 : 500)
}
