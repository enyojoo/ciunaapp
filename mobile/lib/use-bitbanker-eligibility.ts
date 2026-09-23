import useSWR from "swr"
import { fetchWithAuth } from "./api"

export type BitbankerEligibility = {
  status: string
  isVerifiedForSbp: boolean
  clientId: string | null
}

async function load(): Promise<BitbankerEligibility> {
  const res = await fetchWithAuth("/api/bitbanker/eligibility")
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
  return useSWR(key, load, { revalidateOnFocus: true })
}
