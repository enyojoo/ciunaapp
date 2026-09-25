/**
 * Generate Transaction ID
 * Format: CTID followed by 8 digits
 * Example: CTID27382930
 */
export function generateTransactionId(): string {
  // Get last 8 digits of timestamp to ensure uniqueness
  const timestamp = Date.now().toString()
  const last8Digits = timestamp.slice(-8)
  return `CTID${last8Digits}`
}

