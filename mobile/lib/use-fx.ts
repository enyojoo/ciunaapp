import { useCallback, useEffect, useState } from "react"
import { apiFetch } from "./api"
import { supabase } from "./supabase"
import type { RateRow } from "./fx"
import type { CurrencyRow } from "./types"

export function useFx() {
  const [currencies, setCurrencies] = useState<CurrencyRow[]>([])
  const [rates, setRates] = useState<RateRow[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      const [curRes, rateRes] = await Promise.all([
        apiFetch("/api/currencies"),
        supabase.from("exchange_rates").select("*").eq("status", "active"),
      ])
      if (curRes.ok) {
        const body = (await curRes.json()) as { currencies?: CurrencyRow[] }
        setCurrencies(
          (body.currencies || []).map((c) => ({
            ...c,
            code: String(c.code || "").toUpperCase(),
          })),
        )
      }
      if (!rateRes.error && rateRes.data) setRates(rateRes.data as RateRow[])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { currencies, rates, loading, reload }
}
