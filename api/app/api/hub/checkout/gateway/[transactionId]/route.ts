import { type NextRequest, NextResponse } from "next/server"
import { requireAuth, withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { createServerClient } from "@/lib/supabase"

/**
 * Backs the shared `/pay/[transactionId]` page (embeds the YooKassa Checkout.js widget) — used by
 * both the web checkout flow (navigated to directly) and the mobile app (opened in a WebView).
 * Returns just enough to render the widget and to know when to stop polling.
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
      .select("id, transaction_id, user_id, status, payment_provider, gateway_confirmation_url, total_amount, send_currency")
      .eq("transaction_id", transactionId.toUpperCase())
      .maybeSingle()

    if (error || !tx) return createErrorResponse("Transaction not found", 404)
    if (String(tx.user_id) !== user.id) return createErrorResponse("Transaction not found", 404)
    if (tx.payment_provider !== "yookassa") return createErrorResponse("Not an online payment", 400)

    return NextResponse.json({
      transactionId: tx.transaction_id,
      status: tx.status,
      confirmationToken: tx.gateway_confirmation_url,
      amount: tx.total_amount,
      currency: tx.send_currency,
    })
  },
)
