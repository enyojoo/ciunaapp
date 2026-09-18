import { PAYMENT_QR_CODES_BUCKET } from "@ciuna/shared"

/** Supabase public object URLs include this path segment before the object key. */
const paymentQrPublicUrlMarker = `/object/public/${PAYMENT_QR_CODES_BUCKET}/`

/**
 * Returns an error message if `imageUrl` is a Supabase public URL for the payment QR bucket.
 * Hub product images must be stored under the `hub-assets` bucket (see Office `uploadHubProductImage`).
 */
export function hubProductImageUrlPaymentQrBucketError(imageUrl: unknown): string | null {
  if (imageUrl == null) return null
  const s = String(imageUrl).trim()
  if (!s) return null
  if (!s.includes(paymentQrPublicUrlMarker)) return null
  return `Hub product images must be stored in the hub-assets bucket, not ${PAYMENT_QR_CODES_BUCKET}.`
}
