"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchWithAuth } from "@/lib/fetch-with-auth"

export type BitbankerEligibility = {
  status: string
  isVerifiedForSbp: boolean
  clientId: string | null
}

async function load(refresh = false): Promise<BitbankerEligibility> {
  const url = refresh ? "/api/bitbanker/eligibility?refresh=1" : "/api/bitbanker/eligibility"
  const res = await fetchWithAuth(url)
  if (!res.ok) {
    if (res.status === 503) {
      return { status: "unconfigured", isVerifiedForSbp: false, clientId: null }
    }
    throw new Error("Failed to load verification status")
  }
  return (await res.json()) as BitbankerEligibility
}

export function useBitbankerEligibility(userId: string | undefined) {
  const [data, setData] = useState<BitbankerEligibility | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | undefined>(undefined)

  useEffect(() => {
    if (!userId) {
      setData(undefined)
      setIsLoading(false)
      return
    }
    let cancelled = false
    setIsLoading(true)
    setError(undefined)
    void load(false)
      .then((next) => {
        if (!cancelled) setData(next)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const refresh = useCallback(async () => {
    const next = await load(true)
    setData(next)
    return next
  }, [])

  return { data, isLoading, error, refresh, mutate: refresh }
}
