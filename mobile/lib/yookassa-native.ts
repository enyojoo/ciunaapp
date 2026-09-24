/**
 * Native YooKassa payment sheet (store / EAS builds).
 * Returns gracefully in Expo Go and web.
 */

import { fetchWithAuth } from "@/lib/api"

export type YooKassaNativeResult = "succeeded" | "pending" | "cancelled" | "failed"

type NativeModule = {
  isAvailable: () => boolean
  startPayment: (params: {
    amount?: number
    currency?: string
    shopName?: string
    description?: string
    clientApplicationKey?: string
    shopId?: string
  }) => Promise<YooKassaNativeResult>
  show3ds?: (params: {
    confirmationUrl: string
    paymentType: string
    clientApplicationKey?: string
    shopId?: string
  }) => Promise<YooKassaNativeResult>
  takeLastPaymentToken?: () => { token: string; type: string } | null
}

function getNative(): NativeModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("../modules/yookassa-payment/src/index") as {
      default?: NativeModule
    } & NativeModule
    const api = mod.default ?? mod
    if (api && typeof api.startPayment === "function") return api
  } catch {
    // Module not linked
  }
  return null
}

export function isYooKassaNativeAvailable(): boolean {
  const mod = getNative()
  if (!mod) return false
  try {
    return typeof mod.isAvailable === "function" ? mod.isAvailable() : false
  } catch {
    return false
  }
}

/**
 * Full native flow: open SDK sheet → POST payment_token → optional 3DS → succeeded/pending.
 */
export async function startYooKassaPayment(params: {
  confirmationToken?: string
  transactionId: string
  amount?: number
  currency?: string
  shopName?: string
  description?: string
}): Promise<YooKassaNativeResult> {
  const mod = getNative()
  if (!mod || !isYooKassaNativeAvailable()) return "failed"

  const sheet = await mod.startPayment({
    amount: params.amount,
    currency: params.currency || "RUB",
    shopName: params.shopName,
    description: params.description,
    clientApplicationKey: process.env.EXPO_PUBLIC_YOOKASSA_CLIENT_KEY,
    shopId: process.env.EXPO_PUBLIC_YOOKASSA_SHOP_ID,
  })
  if (sheet === "cancelled" || sheet === "failed") return sheet

  const paymentToken = mod.takeLastPaymentToken?.()
  if (!paymentToken?.token) return "failed"

  try {
    const res = await fetchWithAuth(
      `/api/hub/checkout/gateway/${encodeURIComponent(params.transactionId)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentToken: paymentToken.token }),
      },
    )
    const body = (await res.json().catch(() => ({}))) as {
      gateway?: { confirmationUrl?: string }
      error?: string
    }
    if (!res.ok) return "failed"

    const confirmationUrl = body.gateway?.confirmationUrl
    if (confirmationUrl && mod.show3ds) {
      return await mod.show3ds({
        confirmationUrl,
        paymentType: paymentToken.type,
        clientApplicationKey: process.env.EXPO_PUBLIC_YOOKASSA_CLIENT_KEY,
        shopId: process.env.EXPO_PUBLIC_YOOKASSA_SHOP_ID,
      })
    }
    return "pending"
  } catch {
    return "failed"
  }
}
