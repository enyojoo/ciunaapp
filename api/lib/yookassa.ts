/**
 * YooKassa (yookassa.ru) server client — RUB online payments for Hub (Food/Mart cart) and
 * Expert booking checkout. See https://yookassa.ru/developers/using-api/using-sdks.
 *
 * We never trust a webhook payload's status directly (YooKassa does not sign webhook bodies by
 * default) — always re-fetch the payment with `getYooKassaPayment` before acting on a status
 * change. See `api/app/api/webhooks/yookassa/route.ts`.
 */

const YOOKASSA_API_BASE = "https://api.yookassa.ru/v3"

export interface YooKassaAmount {
  value: string
  currency: string
}

export interface YooKassaConfirmation {
  type: "embedded" | "redirect"
  /** Present when `type: "embedded"` — passed to the Checkout.js widget client-side. */
  confirmation_token?: string
  /** Present when `type: "redirect"` — where to send the customer for hosted checkout. */
  confirmation_url?: string
  return_url?: string
}

export type YooKassaPaymentStatus = "pending" | "waiting_for_capture" | "succeeded" | "canceled"

export interface YooKassaPayment {
  id: string
  status: YooKassaPaymentStatus
  paid: boolean
  amount: YooKassaAmount
  confirmation?: YooKassaConfirmation
  description?: string
  metadata?: Record<string, string>
  created_at: string
  captured_at?: string
  cancellation_details?: { party: string; reason: string }
}

function credentials(): { shopId: string; secretKey: string } {
  const shopId = process.env.YOOKASSA_SHOP_ID
  const secretKey = process.env.YOOKASSA_SECRET_KEY
  if (!shopId || !secretKey) {
    throw new Error("YooKassa is not configured (YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY missing)")
  }
  return { shopId, secretKey }
}

function authHeader(): string {
  const { shopId, secretKey } = credentials()
  return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`
}

export interface CreateYooKassaPaymentParams {
  /** Amount in RUB, e.g. 1999.00. */
  amountValue: number
  description: string
  /** Our transaction id — also doubles as the Idempotence-Key so a client retry can't double-charge. */
  idempotenceKey: string
  metadata: Record<string, string>
  /** Where the customer lands after a redirect-type confirmation (the embedded widget also wants this for its own return handling). */
  returnUrl: string
  confirmationType?: "embedded" | "redirect"
  /** Auto-capture on payment (default true) — false if a manual capture step is ever needed. */
  capture?: boolean
}

export async function createYooKassaPayment(params: CreateYooKassaPaymentParams): Promise<YooKassaPayment> {
  const {
    amountValue,
    description,
    idempotenceKey,
    metadata,
    returnUrl,
    confirmationType = "embedded",
    capture = true,
  } = params

  const res = await fetch(`${YOOKASSA_API_BASE}/payments`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      "Idempotence-Key": idempotenceKey,
    },
    body: JSON.stringify({
      amount: { value: amountValue.toFixed(2), currency: "RUB" },
      capture,
      confirmation: { type: confirmationType, return_url: returnUrl },
      description: description.slice(0, 128),
      metadata,
    }),
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error("createYooKassaPayment failed", res.status, body)
    throw new Error(body?.description || "Failed to create payment")
  }
  return body as YooKassaPayment
}

/** Fetches the authoritative payment state — always use this before acting on a webhook notification. */
export async function getYooKassaPayment(paymentId: string): Promise<YooKassaPayment> {
  const res = await fetch(`${YOOKASSA_API_BASE}/payments/${encodeURIComponent(paymentId)}`, {
    method: "GET",
    headers: { Authorization: authHeader() },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error("getYooKassaPayment failed", res.status, body)
    throw new Error(body?.description || "Failed to fetch payment")
  }
  return body as YooKassaPayment
}

export function isYooKassaConfigured(): boolean {
  return Boolean(process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY)
}
