import { type NextRequest, NextResponse } from "next/server"
import { requireAuth, withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { createExpertBookingCheckoutTransaction } from "@/lib/expert-checkout-server"

export const POST = withErrorHandling(async (request: NextRequest) => {
  let user: { id: string }
  try {
    user = await requireAuth(request)
  } catch {
    return createErrorResponse("Unauthorized", 401)
  }

  const body = await request.json().catch(() => ({}))
  const expert_service_slot_id = String(body.expert_service_slot_id || "").trim()
  const sendCurrency = String(body.sendCurrency || "").trim()
  const receiveCurrency = String(body.receiveCurrency || "").trim()
  const contactName = String(body.contactName || "").trim()
  const contactPhone = String(body.contactPhone || "").trim()
  const message = body.message != null ? String(body.message) : null
  const idempotencyKey = body.idempotencyKey != null ? String(body.idempotencyKey) : undefined

  if (!expert_service_slot_id || !sendCurrency || !receiveCurrency) {
    return createErrorResponse("Missing required fields", 400)
  }
  if (!contactName || !contactPhone) {
    return createErrorResponse("Contact name and phone required", 400)
  }

  try {
    const { transaction, duplicate } = await createExpertBookingCheckoutTransaction(user.id, {
      expert_service_slot_id,
      sendCurrency,
      receiveCurrency,
      contactName,
      contactPhone,
      message,
      idempotencyKey,
    })

    if (!duplicate) {
      try {
        const { EmailNotificationService } = await import("@/lib/email-notification-service")
        await EmailNotificationService.sendTransactionStatusEmail(String(transaction.transaction_id), "pending")
        await EmailNotificationService.sendAdminTransactionNotification(String(transaction.transaction_id), "pending")
      } catch (emailError) {
        console.error("Expert checkout email", emailError)
      }
    }

    return NextResponse.json({ transaction, duplicate: !!duplicate })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Checkout failed"
    const code =
      msg.includes("not found") || msg.includes("not available") || msg.includes("just taken")
        ? 409
        : msg.includes("Quote pricing") ||
            msg.includes("currency") ||
            msg.includes("rate") ||
            msg.includes("Mismatch") ||
            msg.includes("Unsupported")
          ? 400
          : 500
    return createErrorResponse(msg, code)
  }
})
