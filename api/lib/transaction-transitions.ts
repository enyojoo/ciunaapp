/**
 * Which status a transaction may move to, by hand in Office. Anything not listed is refused: a finished transaction is
 * not edited, it is retried (failed to processing) or refunded, each with its own permission and a written reason.
 */
export const STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  pending: ["processing", "failed", "cancelled"],
  processing: ["completed", "failed", "cancelled"],
  completed: [],
  failed: [],
  cancelled: [],
  refunded: [],
}

/** Older rows can hold other states (converting, deposited and so on); those keep the old behaviour. */
export function canMoveStatus(from: string, to: string): boolean {
  if (from === to || !(from in STATUS_TRANSITIONS)) return true
  return STATUS_TRANSITIONS[from]!.includes(to)
}

/** States a refund can start from: money was received (processing, completed) or the transfer failed after payment. */
export const REFUNDABLE = ["processing", "completed", "failed"] as const
export const RETRYABLE = ["failed"] as const
