/**
 * Thin JS bridge over `react-native-yookassa` when linked in an EAS / prebuild binary.
 * Expo Go and web: isAvailable() === false.
 */

export type YooKassaNativeResult = "succeeded" | "pending" | "cancelled" | "failed"

type PaymentToken = { token: string; type: string }

type YandexPaymentApi = {
  show: (
    shop: {
      id: string
      token: string
      name: string
      description?: string
      returnUrl?: string
    },
    payment: {
      amount: number
      currency: string
      types?: string[]
      savePaymentMethod?: string
      yooKassaClientId?: string
    },
  ) => Promise<PaymentToken>
  show3ds: (
    requestUrl: string,
    paymentType: string,
    clientApplicationKey: string,
    shopId: string,
  ) => Promise<"RESULT_OK">
  close: () => void
}

function loadYandexPayment(): YandexPaymentApi | null {
  try {
    // Optional peer — only present after EAS prebuild installs react-native-yookassa.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("react-native-yookassa") as {
      default?: YandexPaymentApi
      YandexPayment?: YandexPaymentApi
    } & YandexPaymentApi
    const api = mod.YandexPayment || mod.default || mod
    if (api && typeof api.show === "function") return api
  } catch {
    // not linked
  }
  return null
}

export function isAvailable(): boolean {
  return loadYandexPayment() != null
}

export async function startPayment(params: {
  confirmationToken?: string
  clientApplicationKey?: string
  shopId?: string
  amount?: number
  currency?: string
  shopName?: string
  description?: string
}): Promise<YooKassaNativeResult> {
  const api = loadYandexPayment()
  if (!api) return "failed"

  const shopId = params.shopId || process.env.EXPO_PUBLIC_YOOKASSA_SHOP_ID || ""
  const clientKey =
    params.clientApplicationKey || process.env.EXPO_PUBLIC_YOOKASSA_CLIENT_KEY || ""
  if (!shopId || !clientKey || !(params.amount != null && params.amount > 0)) {
    return "failed"
  }

  try {
    const token = await api.show(
      {
        id: shopId,
        token: clientKey,
        name: params.shopName || "Ciuna",
        description: params.description || "Order payment",
      },
      {
        amount: params.amount,
        currency: params.currency || "RUB",
        types: ["BANK_CARD", "SBERBANK", "YOO_MONEY", "SBP"],
        savePaymentMethod: "OFF",
        yooKassaClientId: shopId,
      },
    )
    // Caller posts `token.token` to the API; we stash it on the result via a side channel:
    // return "pending" and expose lastToken for the JS orchestrator.
    ;(globalThis as { __yookassaLastPaymentToken?: PaymentToken }).__yookassaLastPaymentToken = token
    return "pending"
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/cancel/i.test(msg)) return "cancelled"
    return "failed"
  }
}

export async function show3ds(params: {
  confirmationUrl: string
  paymentType: string
  clientApplicationKey?: string
  shopId?: string
}): Promise<YooKassaNativeResult> {
  const api = loadYandexPayment()
  if (!api) return "failed"
  const shopId = params.shopId || process.env.EXPO_PUBLIC_YOOKASSA_SHOP_ID || ""
  const clientKey =
    params.clientApplicationKey || process.env.EXPO_PUBLIC_YOOKASSA_CLIENT_KEY || ""
  try {
    await api.show3ds(params.confirmationUrl, params.paymentType, clientKey, shopId)
    api.close()
    return "succeeded"
  } catch {
    try {
      api.close()
    } catch {
      // ignore
    }
    return "failed"
  }
}

export function takeLastPaymentToken(): PaymentToken | null {
  const g = globalThis as { __yookassaLastPaymentToken?: PaymentToken }
  const t = g.__yookassaLastPaymentToken || null
  g.__yookassaLastPaymentToken = undefined
  return t
}

export default { isAvailable, startPayment, show3ds, takeLastPaymentToken }
