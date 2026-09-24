import { bitbankerApiBaseUrl, bitbankerCredentials, bitbankerEnvironment } from "./config"
import { attachFullSign, newNonce, unixTimestampSeconds, verifyFullSign } from "./signing"

export class BitbankerApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

type RequestOptions = {
  method: "GET" | "POST"
  path: string
  query?: Record<string, string | number | boolean | undefined>
  body?: Record<string, unknown>
  signBody?: boolean
  /** Sign GET query params (timestamp, nonce, full_sign) per Bitbanker API. */
  signQuery?: boolean
  idempotencyKey?: string
  /** When false, skip response full_sign verification (e.g. unsigned KYC bridge). Default true. */
  verifyResponse?: boolean
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const base = bitbankerApiBaseUrl()
  const normalized = path.startsWith("/") ? path : `/${path}`
  const url = new URL(`${base}${normalized}`)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue
      url.searchParams.set(k, String(v))
    }
  }
  return url.toString()
}

/** Build signed query fields for Bitbanker GET (timestamp, nonce, full_sign). */
export function signedGetQuery(fields: Record<string, unknown>): Record<string, string> {
  const { apiSecret } = bitbankerCredentials()
  const unsigned = { ...fields }
  if (unsigned.timestamp == null) unsigned.timestamp = unixTimestampSeconds()
  if (unsigned.nonce == null) unsigned.nonce = newNonce()
  const signed = attachFullSign(unsigned, apiSecret)
  return Object.fromEntries(Object.entries(signed).map(([k, v]) => [k, String(v)]))
}

export async function bitbankerRequest<T = unknown>(opts: RequestOptions): Promise<T> {
  const { apiKey, apiSecret } = bitbankerCredentials()
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-API-KEY": apiKey,
  }
  if (opts.idempotencyKey) {
    headers["Idempotency-Key"] = opts.idempotencyKey
  }

  let query = opts.query ? { ...opts.query } : undefined
  let body: Record<string, unknown> | undefined
  if (opts.method === "POST" && opts.body) {
    body = { ...opts.body }
    if (opts.signBody !== false) {
      if (body.timestamp == null) body.timestamp = unixTimestampSeconds()
      if (body.nonce == null) body.nonce = newNonce()
      body = attachFullSign(body, apiSecret)
    }
    headers["Content-Type"] = "application/json"
  }

  if (opts.method === "GET" && opts.signQuery) {
    const unsigned: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(query ?? {})) {
      if (v !== undefined && v !== null) unsigned[k] = v
    }
    query = signedGetQuery(unsigned)
  }

  const res = await fetch(buildUrl(opts.path, query), {
    method: opts.method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let parsed: unknown = null
  if (text) {
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = text
    }
  }

  if (!res.ok) {
    throw new BitbankerApiError(
      `Bitbanker ${opts.method} ${opts.path} failed (${res.status})`,
      res.status,
      parsed,
    )
  }

  const shouldVerifyResponse = opts.verifyResponse !== false
  if (
    shouldVerifyResponse &&
    parsed &&
    typeof parsed === "object" &&
    !Array.isArray(parsed)
  ) {
    const record = parsed as Record<string, unknown>
    if ("full_sign" in record && !verifyFullSign(record, apiSecret)) {
      const strict =
        process.env.BITBANKER_VERIFY_RESPONSES === "1" ||
        (process.env.BITBANKER_VERIFY_RESPONSES !== "0" &&
          bitbankerEnvironment() === "production")
      if (strict) {
        throw new BitbankerApiError("Bitbanker response signature invalid", res.status, parsed)
      }
      console.warn(
        "[bitbanker] response full_sign did not verify locally; continuing (sandbox). Set BITBANKER_VERIFY_RESPONSES=1 to fail hard.",
      )
    }
  }

  return parsed as T
}

/** User-facing detail from Bitbanker error JSON (400/403 on invoices, partner-clients, etc.). */
export function formatBitbankerApiError(e: unknown): string {
  if (!(e instanceof BitbankerApiError)) {
    return e instanceof Error ? e.message : "Bitbanker request failed"
  }
  const body = e.body
  if (typeof body === "string" && body.trim()) return body.trim()
  if (body && typeof body === "object" && !Array.isArray(body)) {
    const rec = body as Record<string, unknown>
    for (const key of ["message", "error", "detail", "description", "title"]) {
      const v = rec[key]
      if (typeof v === "string" && v.trim()) return v.trim()
    }
    const errors = rec.errors
    if (Array.isArray(errors)) {
      const parts = errors
        .map((item) => {
          if (typeof item === "string") return item
          if (item && typeof item === "object") {
            const o = item as Record<string, unknown>
            return [o.message, o.detail, o.field].filter((x) => typeof x === "string").join(": ")
          }
          return ""
        })
        .filter(Boolean)
      if (parts.length) return parts.join("; ")
    }
    try {
      const compact = JSON.stringify(body)
      if (compact && compact !== "{}") return compact
    } catch {
      /* ignore */
    }
  }
  return e.message
}
