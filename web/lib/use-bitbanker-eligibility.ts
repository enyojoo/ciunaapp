"use client"

import useSWR from "swr"
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
  const key = userId ? `bitbanker-eligibility-${userId}` : null
  const swr = useSWR(key, () => load(false), { revalidateOnFocus: true })
  return {
    ...swr,
    refresh: async () => {
      const next = await load(true)
      await swr.mutate(next, false)
      return next
    },
  }
}
