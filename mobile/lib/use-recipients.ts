import { fetchWithAuth } from "./api"
import { useCachedQuery } from "./use-cached-query"
import type { RecipientRow } from "./types"

const RECIPIENTS_TTL_MS = 5 * 60_000

async function fetchRecipients(): Promise<RecipientRow[]> {
  const res = await fetchWithAuth("/api/recipients")
  if (!res.ok) throw new Error("Failed to load recipients")
  const data = (await res.json()) as { recipients?: RecipientRow[] }
  return data.recipients || []
}

/** Shared by the recipients list/form, send, and the referrals withdraw sheet. */
export function useRecipients(userId: string | null | undefined) {
  const key = userId ? `ciuna_recipients_${userId}` : null
  return useCachedQuery<RecipientRow[]>(key, fetchRecipients, { ttlMs: RECIPIENTS_TTL_MS })
}
