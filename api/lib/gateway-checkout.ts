import { createServerClient } from "@/lib/supabase"
import { createYooKassaPayment } from "@/lib/yookassa"

export interface GatewayConfirmation {
  confirmationType: "embedded" | "redirect"
  confirmationToken?: string
  confirmationUrl?: string
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
}): Promise<GatewayConfirmation> {
  const server = createServerClient()
  try {
    const payment = await createYooKassaPayment({
      amountValue: params.amount,
      description: params.description,
      idempotenceKey: params.transactionId,
      metadata: params.metadata,
      returnUrl: params.returnUrl,
    })

    const { error: updErr } = await server
      .from("transactions")
      .update({
        gateway_payment_id: payment.id,
        gateway_status: payment.status,
        gateway_confirmation_url: payment.confirmation?.confirmation_url || payment.confirmation?.confirmation_token || null,
      })
      .eq("id", params.transactionRowId)

    if (updErr) {
      console.error("attachYooKassaPayment: failed to store gateway reference", updErr)
      throw new Error("Failed to save payment reference")
    }

    return {
      confirmationType: payment.confirmation?.type || "embedded",
      confirmationToken: payment.confirmation?.confirmation_token,
      confirmationUrl: payment.confirmation?.confirmation_url,
    }
  } catch (e) {
    await server.from("transactions").delete().eq("id", params.transactionRowId)
    throw e
  }
}
