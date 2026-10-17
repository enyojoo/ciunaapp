import { fetchWithAuth } from "./api"
import { useCachedQuery } from "./use-cached-query"
import { seedTransactionCache } from "./use-transaction"
import type { CombinedTransaction } from "./types"

export const TX_TTL_MS = 2 * 60_000

export async function fetchTransactions(): Promise<CombinedTransaction[]> {
  const res = await fetchWithAuth("/api/transactions?type=all&limit=100")
  if (!res.ok) throw new Error("Failed to load transactions")
  const data = (await res.json()) as { transactions?: CombinedTransaction[] }
  const rows = data.transactions || []
  seedTransactionCache(rows)
  return rows
}

/** The combined send, order and booking list. Activities and Home share this one cache entry. */
export function useTransactions(userId: string | null | undefined) {
  const key = userId ? `ciuna_transactions_${userId}` : null
  return useCachedQuery<CombinedTransaction[]>(key, fetchTransactions, { ttlMs: TX_TTL_MS })
}
