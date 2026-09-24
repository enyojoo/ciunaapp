import { useCallback, useEffect, useState } from "react"
import { subscribeOfficeConfigRevalidate } from "./config-revalidate-bus"
import { fetchWithAuth } from "./api"

export type SendPaymentMethod = {
  id: string
  currency: string
  provider: string
  isDefault?: boolean
}

export function useSendPaymentMethods(currency: string) {
  const [methods, setMethods] = useState<SendPaymentMethod[]>([])
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    const code = currency.trim()
    if (!code) {
      setMethods([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetchWithAuth(`/api/payment-methods/send?currency=${encodeURIComponent(code)}`)
      if (!res.ok) {
        setMethods([])
        return
      }
      const body = (await res.json()) as { methods?: SendPaymentMethod[] }
      setMethods(body.methods || [])
    } finally {
      setLoading(false)
    }
  }, [currency])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await reload()
      if (cancelled) return
    })()
    return () => {
      cancelled = true
    }
  }, [reload])

  useEffect(() => subscribeOfficeConfigRevalidate("paymentMethods", () => void reload()), [reload])

  return { methods, loading, reload }
}
