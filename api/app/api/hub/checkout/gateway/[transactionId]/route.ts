import { type NextRequest, NextResponse } from "next/server"
import { requireAuth, withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { attachYooKassaPayment } from "@/lib/gateway-checkout"
import { createServerClient } from "@/lib/supabase"
import { getYooKassaPayment, type YooKassaPaymentStatus } from "@/lib/yookassa"
import type { Transaction } from "@/types"

function targetStatus(paymentStatus: YooKassaPaymentStatus): Transaction["status"] | null {
  if (paymentStatus === "succeeded") return "completed"
  if (paymentStatus === "waiting_for_capture") return "processing"
  if (paymentStatus === "canceled") return "failed"
  return null
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["processing", "completed", "failed", "cancelled"],
  processing: ["completed", "failed", "cancelled"],
  completed: [],
  failed: [],
  cancelled: [],
}

/**
 * GET — poll / resume: status + embedded confirmation_token for Checkout.js (web / Expo web).
 * When still pending, re-fetches from YooKassa so local/dev works even if the HTTP webhook
 * points at production (or is delayed).
 * POST — native SDK: attach a payment_token from the iOS/Android tokenization sheet.
 */
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ transactionId: string }> }) => {
    let user: { id: string }
    try {
      user = await requireAuth(request)
    } catch {
      return createErrorResponse("Unauthorized", 401)
    }

    const { transactionId } = await params
    const server = createServerClient()
    const { data: tx, error } = await server
      .from("transactions")
      .select(
        "id, transaction_id, user_id, status, payment_provider, gateway_confirmation_url, gateway_payment_id, total_amount, send_currency",
      )
      .eq("transaction_id", transactionId.toUpperCase())
      .maybeSingle()

    if (error || !tx) return createErrorResponse("Transaction not found", 404)
    if (String(tx.user_id) !== user.id) return createErrorResponse("Transaction not found", 404)
    if (tx.payment_provider !== "yookassa") return createErrorResponse("Not an online payment", 400)

    let status = String(tx.status || "pending")

    if (
      tx.gateway_payment_id &&
      (status === "pending" || status === "processing")
    ) {
      try {
        const payment = await getYooKassaPayment(String(tx.gateway_payment_id))
        const next = targetStatus(payment.status)
        if (next && (VALID_TRANSITIONS[status] || []).includes(next)) {
          const { error: updErr } = await server
            .from("transactions")
            .update({
              status: next,
              gateway_status: payment.status,
              updated_at: new Date().toISOString(),
            })
            .eq("id", tx.id)
          if (!updErr) status = next
        } else {
          await server
            .from("transactions")
            .update({ gateway_status: payment.status, updated_at: new Date().toISOString() })
            .eq("id", tx.id)
        }
      } catch (e) {
        console.warn("yookassa gateway GET sync failed", e)
      }
    }

    return NextResponse.json({
      transactionId: tx.transaction_id,
      status,
      confirmationToken: tx.gateway_confirmation_url,
      amount: tx.total_amount,
      currency: tx.send_currency,
    })
  },
)

export const POST = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ transactionId: string }> }) => {
    let user: { id: string }
    try {
      user = await requireAuth(request)
    } catch {
      return createErrorResponse("Unauthorized", 401)
    }

    const { transactionId } = await params
    const body = await request.json().catch(() => ({}))
    const paymentToken = String(body.paymentToken || "").trim()
    if (!paymentToken) return createErrorResponse("paymentToken required", 400)

    const server = createServerClient()
    const { data: tx, error } = await server
      .from("transactions")
      .select(
        "id, transaction_id, user_id, status, payment_provider, gateway_payment_id, total_amount, send_currency, hub_snapshot",
      )
      .eq("transaction_id", transactionId.toUpperCase())
      .maybeSingle()

    if (error || !tx) return createErrorResponse("Transaction not found", 404)
    if (String(tx.user_id) !== user.id) return createErrorResponse("Transaction not found", 404)
    if (tx.payment_provider !== "yookassa") return createErrorResponse("Not an online payment", 400)
    if (tx.gateway_payment_id) {
      return NextResponse.json({
        transactionId: tx.transaction_id,
        status: tx.status,
        alreadyAttached: true,
      })
    }
    if (String(tx.send_currency || "").toUpperCase() !== "RUB") {
      return createErrorResponse("Online payment is only available in RUB", 400)
    }

    const snapshot = (tx.hub_snapshot || {}) as { productTitle?: string }
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://app.ciuna.com").replace(/\/$/, "")
    const gateway = await attachYooKassaPayment({
      transactionRowId: String(tx.id),
      transactionId: String(tx.transaction_id),
      amount: Number(tx.total_amount) || 0,
      description: snapshot.productTitle || `Order ${tx.transaction_id}`,
      returnUrl: `${appUrl}/pay/${String(tx.transaction_id).toLowerCase()}`,
      metadata: { transactionId: String(tx.transaction_id), userId: user.id },
      paymentToken,
      deleteOnFailure: false,
    })

    return NextResponse.json({
      transactionId: tx.transaction_id,
      gateway,
    })
  },
)
