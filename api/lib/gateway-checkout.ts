import { createServerClient } from "@/lib/supabase"
import { createYooKassaPayment } from "@/lib/yookassa"

export interface GatewayConfirmation {
  confirmationType: "embedded" | "redirect" | "native"
  confirmationToken?: string
  confirmationUrl?: string
  /** Present for native mode before a payment_token is attached — amount the SDK should charge. */
  amount?: number
  currency?: string
}

/** Resolve Checkout.js / redirect return_url. Full page URLs (Expo web checkout) are used as-is. */
export function resolveYooKassaReturnUrl(returnUrl: string | undefined, transactionId: string): string {
  const raw = (returnUrl?.trim() || process.env.NEXT_PUBLIC_APP_URL || "https://app.ciuna.com").replace(/\/$/, "")
  try {
    const u = new URL(raw)
    if (u.pathname && u.pathname !== "/") return raw
  } catch {
    // fall through
  }
  return `${raw}/pay/${transactionId.toLowerCase()}`
}

/**
 * Creates the YooKassa payment for an already-inserted `transactions` row and stores the
 * gateway reference on it. On failure, deletes the row (and, via `on delete cascade`, its
 * `hub_order_items`) so a failed gateway call never leaves a dangling `pending` order behind —
 * the caller should treat a thrown error here as "checkout failed", not "placed, payment pending".
 *
 * Shared by Hub cart checkout and Expert booking checkout — anywhere a `transactions` header row
 * is created up front and then handed off to YooKassa.
 */
export async function attachYooKassaPayment(params: {
  /** `transactions.id` (uuid PK), not the human-readable `transaction_id`. */
  transactionRowId: string
  /** Human-readable `transaction_id` (e.g. ETID12345678) — used as the Idempotence-Key. */
  transactionId: string
  /** Amount in RUB. */
  amount: number
  description: string
  returnUrl: string
  metadata: Record<string, string>
  /** When set, creates the payment from a native SDK payment_token (no embedded widget). */
  paymentToken?: string
  /** If false, leave the transaction row on failure (used when attaching token after order create). */
  deleteOnFailure?: boolean
}): Promise<GatewayConfirmation> {
  const server = createServerClient()
  const deleteOnFailure = params.deleteOnFailure !== false
  try {
    const payment = await createYooKassaPayment({
      amountValue: params.amount,
      description: params.description,
      idempotenceKey: params.paymentToken
        ? `${params.transactionId}:token`
        : params.transactionId,
      metadata: params.metadata,
      returnUrl: params.returnUrl,
      paymentToken: params.paymentToken,
    })

    const { error: updErr } = await server
      .from("transactions")
      .update({
        gateway_payment_id: payment.id,
        gateway_status: payment.status,
        gateway_confirmation_url:
          payment.confirmation?.confirmation_url || payment.confirmation?.confirmation_token || null,
      })
      .eq("id", params.transactionRowId)

    if (updErr) {
      console.error("attachYooKassaPayment: failed to store gateway reference", updErr)
      throw new Error("Failed to save payment reference")
    }

    return {
      confirmationType: params.paymentToken
        ? payment.confirmation?.confirmation_url
          ? "redirect"
          : "native"
        : payment.confirmation?.type || "embedded",
      confirmationToken: payment.confirmation?.confirmation_token,
      confirmationUrl: payment.confirmation?.confirmation_url,
    }
  } catch (e) {
    if (deleteOnFailure) {
      await server.from("transactions").delete().eq("id", params.transactionRowId)
    }
    throw e
  }
}
