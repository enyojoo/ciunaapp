import { fetchWithAuth } from "./api"
import { writeCache } from "./cache"
import { useCachedQuery } from "./use-cached-query"
import type { CombinedTransaction } from "./types"

const TTL_MS = 2 * 60_000

export function transactionCacheKey(transactionId: string): string {
  return `ciuna_transaction_${transactionId.toUpperCase()}`
}

/** Lets the transactions list make the order-detail screen instant. */
export function seedTransactionCache(transactions: CombinedTransaction[]): void {
  for (const tx of transactions) {
    if (tx?.transaction_id) void writeCache(transactionCacheKey(tx.transaction_id), tx)
  }
}

async function fetchTransaction(transactionId: string): Promise<CombinedTransaction> {
  const res = await fetchWithAuth(`/api/transactions/${encodeURIComponent(transactionId.toUpperCase())}/status`)
  if (!res.ok) throw new Error("Transaction not found")
  const body = (await res.json()) as { transaction?: CombinedTransaction }
  if (!body.transaction) throw new Error("Transaction not found")
  return body.transaction
}

/** Instant when the transactions list already seeded this row; otherwise fetches once. */
export function useTransaction(transactionId: string | null | undefined) {
  const key = transactionId ? transactionCacheKey(transactionId) : null
  return useCachedQuery<CombinedTransaction>(key, () => fetchTransaction(transactionId as string), { ttlMs: TTL_MS })
}
