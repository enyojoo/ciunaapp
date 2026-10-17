import { MerchantError } from "./errors"

export type Credential = { title: string; issuer?: string; year?: number }
export const MAX_CREDENTIALS = 10

/** Validates what the seller typed. Throws a MerchantError naming the problem; returns the cleaned list. */
export function cleanCredentials(input: unknown, thisYear = new Date().getFullYear()): Credential[] {
  if (!Array.isArray(input)) throw new MerchantError("CREDENTIALS_INVALID", 400)
  if (input.length > MAX_CREDENTIALS) throw new MerchantError("CREDENTIALS_TOO_MANY", 400)
  return input.map((c) => {
    const title = String(c?.title ?? "").trim()
    if (!title || [...title].length > 120) throw new MerchantError("CREDENTIAL_TITLE_INVALID", 400)
    const issuer = String(c?.issuer ?? "").trim()
    if ([...issuer].length > 120) throw new MerchantError("CREDENTIAL_ISSUER_INVALID", 400)
    const hasYear = c?.year != null && c.year !== ""
    const year = hasYear ? Number(c.year) : null
    if (year != null && !(Number.isInteger(year) && year >= 1950 && year <= thisYear)) throw new MerchantError("CREDENTIAL_YEAR_INVALID", 400)
    return { title, ...(issuer ? { issuer } : {}), ...(year != null ? { year } : {}) }
  })
}

export function cleanYears(input: unknown): number | null {
  if (input == null || input === "") return null
  const n = Number(input)
  if (!(Number.isInteger(n) && n >= 0 && n <= 80)) throw new MerchantError("YEARS_INVALID", 400)
  return n
}
