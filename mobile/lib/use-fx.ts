import { useEffect } from "react"
import { subscribeOfficeConfigRevalidate } from "./config-revalidate-bus"
import { apiFetch } from "./api"
import { supabase } from "./supabase"
import { useCachedQuery } from "./use-cached-query"
import type { RateRow } from "./fx"
import type { CurrencyRow } from "./types"

type FxData = { currencies: CurrencyRow[]; rates: RateRow[] }

/** Public, not user-specific — one shared cache entry for the whole app. */
const FX_CACHE_KEY = "ciuna_fx_v2"
/** Short TTL; Office edits also push via {@link OfficeConfigLiveSync} Realtime. */
const FX_TTL_MS = 60_000

async function fetchFx(): Promise<FxData> {
  const [curRes, rateRes] = await Promise.all([
    apiFetch("/api/currencies"),
    supabase.from("exchange_rates").select("*").eq("status", "active"),
  ])
  if (!curRes.ok) throw new Error("Failed to load currencies")
  if (rateRes.error) throw rateRes.error
  const body = (await curRes.json()) as { currencies?: CurrencyRow[] }
  const currencies = (body.currencies || []).map((c) => ({ ...c, code: String(c.code || "").toUpperCase() }))
  const rates = (rateRes.data || []) as RateRow[]
  return { currencies, rates }
}

export function useFx() {
  const { data, loading, revalidate } = useCachedQuery<FxData>(FX_CACHE_KEY, fetchFx, { ttlMs: FX_TTL_MS })

  useEffect(() => subscribeOfficeConfigRevalidate("fx", () => void revalidate()), [revalidate])

  return {
    currencies: data?.currencies ?? [],
    rates: data?.rates ?? [],
    loading,
    reload: revalidate,
  }
}
