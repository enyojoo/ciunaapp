import { createHmac, timingSafeEqual } from "crypto"

/**
 * Bitbanker full_sign: hmac(canonical_json(body_without_sign_and_full_sign), api_secret, sha256)
 * per public OpenAPI field descriptions.
 */

function canonicalize(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value
  if (Array.isArray(value)) return value.map(canonicalize)
  const obj = value as Record<string, unknown>
  const sorted: Record<string, unknown> = {}
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = canonicalize(obj[key])
  }
  return sorted
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

export function computeFullSign(bodyWithoutSign: Record<string, unknown>, apiSecret: string): string {
  const payload = canonicalJson(bodyWithoutSign)
  return createHmac("sha256", apiSecret).update(payload, "utf8").digest("hex")
}

export function attachFullSign<T extends Record<string, unknown>>(
  body: T,
  apiSecret: string,
): T & { full_sign: string } {
  const { full_sign: _fs, sign: _s, ...rest } = body as T & { full_sign?: string; sign?: string }
  const full_sign = computeFullSign(rest, apiSecret)
  return { ...rest, full_sign } as T & { full_sign: string }
}

export function verifyFullSign(payload: Record<string, unknown>, apiSecret: string): boolean {
  const provided = String(payload.full_sign ?? payload.sign ?? "").trim()
  if (!provided) return false
  const { full_sign: _fs, sign: _s, ...rest } = payload
  const expected = computeFullSign(rest, apiSecret)
  try {
    const a = Buffer.from(provided, "utf8")
    const b = Buffer.from(expected, "utf8")
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return provided === expected
  }
}

export function newNonce(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

export function unixTimestampSeconds(): number {
  return Math.floor(Date.now() / 1000)
}
