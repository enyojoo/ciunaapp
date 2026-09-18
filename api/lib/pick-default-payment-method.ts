/** Mirrors `/send` payment-method selection: active methods for currency, prefer default flag then first. */

export function paymentMethodsForCurrency<T extends { currency: string; status?: string | null }>(
  methods: T[],
  currency: string,
): T[] {
  return methods.filter((pm) => pm.currency === currency && pm.status === "active")
}

export function pickDefaultPaymentMethod<T extends { currency: string; status?: string | null; is_default?: boolean | null }>(
  methods: T[],
  currency: string,
): T | null {
  const list = paymentMethodsForCurrency(methods, currency)
  return list.find((pm) => pm.is_default) || list[0] || null
}
