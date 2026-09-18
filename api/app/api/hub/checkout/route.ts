import { type NextRequest, NextResponse } from "next/server"
import { requireAuth, withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { createHubCartCheckoutTransaction, createHubCheckoutTransaction, validateHubFormAnswers } from "@/lib/hub-checkout-server"
import { createServerClient } from "@/lib/supabase"

async function sendCheckoutEmails(transactionId: string) {
  try {
    const { EmailNotificationService } = await import("@/lib/email-notification-service")
    await EmailNotificationService.sendTransactionStatusEmail(transactionId, "pending")
    await EmailNotificationService.sendAdminTransactionNotification(transactionId, "pending")
  } catch (emailError) {
    console.error("Hub checkout email", emailError)
  }
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  let user: { id: string }
  try {
    user = await requireAuth(request)
  } catch {
    return createErrorResponse("Unauthorized", 401)
  }

  const body = await request.json()

  // Cart-based checkout (Food/Mart, multi-item). Legacy single-product/`user_input` path below.
  const cartId = String(body.cartId || "").trim()
  if (cartId) {
    const sendCurrency = String(body.sendCurrency || "").trim()
    const contactName = String(body.contactName || "").trim()
    const contactPhone = String(body.contactPhone || "").trim()
    const deliveryAddressLine = body.deliveryAddressLine != null ? String(body.deliveryAddressLine) : null
    const deliveryAddressId = body.deliveryAddressId != null ? String(body.deliveryAddressId) : null
    const formAnswers = typeof body.formAnswers === "object" && body.formAnswers !== null ? body.formAnswers : {}
    const idempotencyKey = body.idempotencyKey != null ? String(body.idempotencyKey) : undefined
    const paymentMethod = body.paymentMethod === "yookassa" ? "yookassa" : "manual"
    const returnUrl = body.returnUrl != null ? String(body.returnUrl) : undefined

    if (!sendCurrency || !contactName || !contactPhone) {
      return createErrorResponse("Missing required fields", 400)
    }

    try {
      const { transaction, duplicate, gateway } = await createHubCartCheckoutTransaction(user.id, {
        cartId,
        sendCurrency,
        contactName,
        contactPhone,
        deliveryAddressLine,
        deliveryAddressId,
        formAnswers: formAnswers as Record<string, unknown>,
        idempotencyKey,
        paymentMethod,
        returnUrl,
      })

      if (!duplicate) await sendCheckoutEmails(String(transaction.transaction_id))

      return NextResponse.json({ transaction, duplicate: !!duplicate, gateway })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Checkout failed"
      const code =
        msg.includes("not found") || msg.includes("no longer available") || msg.includes("no longer active")
          ? 404
          : msg.includes("required") ||
              msg.includes("empty") ||
              msg.includes("RUB") ||
              msg.includes("currency") ||
              msg.includes("rate")
            ? 400
            : 500
      return createErrorResponse(msg, code)
    }
  }

  const hubProductId = String(body.hubProductId || "").trim()
  const sendCurrency = String(body.sendCurrency || "").trim()
  const receiveCurrency = String(body.receiveCurrency || "").trim()
  const fundedAmount = body.fundedAmount != null ? Number(body.fundedAmount) : undefined
  const contactName = String(body.contactName || "").trim()
  const contactPhone = String(body.contactPhone || "").trim()
  const deliveryAddressLine = body.deliveryAddressLine != null ? String(body.deliveryAddressLine) : null
  const deliveryAddressId = body.deliveryAddressId != null ? String(body.deliveryAddressId) : null
  const formAnswers = typeof body.formAnswers === "object" && body.formAnswers !== null ? body.formAnswers : {}
  const idempotencyKey = body.idempotencyKey != null ? String(body.idempotencyKey) : undefined

  if (!hubProductId || !sendCurrency || !receiveCurrency) {
    return createErrorResponse("Missing required fields", 400)
  }
  if (!contactName || !contactPhone) {
    return createErrorResponse("Contact name and phone required", 400)
  }

  const server = createServerClient()
  const { data: product } = await server
    .from("hub_products")
    .select("form_schema, pricing_type, fulfillment_type")
    .eq("id", hubProductId)
    .single()

  const fv = validateHubFormAnswers(product?.form_schema, formAnswers as Record<string, unknown>)
  if (!fv.ok) {
    return createErrorResponse(fv.message, 400)
  }

  try {
    const { transaction, duplicate } = await createHubCheckoutTransaction(user.id, {
      hubProductId,
      sendCurrency,
      receiveCurrency,
      fundedAmount,
      contactName,
      contactPhone,
      deliveryAddressLine,
      deliveryAddressId,
      formAnswers: formAnswers as Record<string, unknown>,
      idempotencyKey,
    })

    if (!duplicate) await sendCheckoutEmails(String(transaction.transaction_id))

    return NextResponse.json({ transaction, duplicate: !!duplicate })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Checkout failed"
    const code =
      msg.includes("not found") || msg.includes("not available")
        ? 404
        : msg.includes("Minimum") || msg.includes("Maximum") || msg.includes("Amount") || msg.includes("rate")
          ? 400
          : 500
    return createErrorResponse(msg, code)
  }
})
