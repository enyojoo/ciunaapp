import { bitbankerApiBaseUrl, bitbankerCredentials } from "./config"
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

export async function bitbankerRequest<T = unknown>(opts: RequestOptions): Promise<T> {
  const { apiKey, apiSecret } = bitbankerCredentials()
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-API-KEY": apiKey,
  }
  if (opts.idempotencyKey) {
    headers["Idempotency-Key"] = opts.idempotencyKey
  }

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

  const res = await fetch(buildUrl(opts.path, opts.query), {
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
      throw new BitbankerApiError("Bitbanker response signature invalid", res.status, parsed)
    }
  }

  return parsed as T
}
