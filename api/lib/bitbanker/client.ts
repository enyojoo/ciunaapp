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

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
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
