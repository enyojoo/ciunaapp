import { fetchWithAuth } from "./api"
import { useCachedQuery } from "./use-cached-query"

export type KycSubmission = {
  id: string
  type: "identity" | "address"
  status: "pending" | "in_review" | "approved" | "rejected"
  country_code?: string
  id_type?: string
  address?: string
  document_type?: string
  rejection_reason?: string
}

const KYC_TTL_MS = 5 * 60_000

async function fetchKycSubmissions(): Promise<KycSubmission[]> {
  const res = await fetchWithAuth("/api/kyc/submissions")
  if (!res.ok) throw new Error("Failed to load verification status")
  const body = (await res.json()) as { submissions?: KycSubmission[] }
  return body.submissions || []
}

/** Shared by More, the verification hub, and the identity/address forms — one fetch, one cache entry. */
export function useKycSubmissions(userId: string | null | undefined) {
  const key = userId ? `ciuna_kyc_submissions_${userId}` : null
  return useCachedQuery<KycSubmission[]>(key, fetchKycSubmissions, { ttlMs: KYC_TTL_MS })
}
