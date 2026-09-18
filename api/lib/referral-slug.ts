const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

export function generateReferralSlug(length = 18): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let out = ""
  for (let i = 0; i < length; i++) {
    out += ALPHANUM[bytes[i]! % ALPHANUM.length]
  }
  return out
}

/** Single-segment routes that must not be treated as referral slugs */
export const RESERVED_REFERRAL_SLUGS = new Set([
  "api",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "dashboard",
  "send",
  "transactions",
  "recipients",
  "more",
  "support",
  "auth",
])
