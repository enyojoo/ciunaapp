import { type NextRequest, NextResponse } from "next/server"
import { transactionService, currencyService } from "@/lib/database"
import { combinedTransactionService } from "@/lib/combined-transaction-service"
import { requireUser, createErrorResponse, withErrorHandling } from "@/lib/auth-utils"
import { computeLogisticsFee, resolveFulfillment } from "@/lib/send-fulfillment"
import { roundMoney } from "@/utils/currency"

export const GET = withErrorHandling(async (request: NextRequest) => {
  const user = await requireUser(request)
  const { searchParams } = new URL(request.url)
  const type = (searchParams.get("type") || "all") as "all" | "send" | "hub"
  const status = searchParams.get("status") || undefined
  const limit = parseInt(searchParams.get("limit") || "100")

  const transactions = await combinedTransactionService.getUserAllTransactions(user.id, {
    type,
    status,
    limit,
  })

  return NextResponse.json({ transactions })
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await requireUser(request)
  const body = await request.json()
  const sendAmount = Number(body.sendAmount)
  const sendCurrency = String(body.sendCurrency || "").trim()
  const receiveCurrency = String(body.receiveCurrency || "").trim()
  const requestedFulfillment = body.fulfillmentType === "cash_hand" ? "cash_hand" : "bank_transfer"

  if (!sendAmount || !sendCurrency || !receiveCurrency) {
    return createErrorResponse("Missing required fields", 400)
  }
  if (sendAmount <= 0) {
    return createErrorResponse("Send amount must be greater than 0", 400)
  }

  const rateData = await currencyService.getRate(sendCurrency, receiveCurrency)
  if (!rateData) {
    return createErrorResponse("Exchange rate not available", 400)
  }

  const receiveAmount =
    body.receiveAmount != null ? Number(body.receiveAmount) : sendAmount * rateData.rate

  const fulfillmentCheck = resolveFulfillment(receiveAmount, rateData)
  const fulfillment =
    fulfillmentCheck.ok && fulfillmentCheck.fulfillment === "cash_hand" && requestedFulfillment === "cash_hand"
      ? "cash_hand"
      : "bank_transfer"

  if (fulfillment === "bank_transfer" && !body.recipientId) {
    return createErrorResponse("Recipient is required", 400)
  }
  if (fulfillment === "cash_hand" && !body.deliveryAddressId && !body.deliveryAddressLine) {
    return createErrorResponse("Delivery address is required", 400)
  }

  let feeAmount = 0
  if (rateData.fee_type === "fixed") {
    feeAmount = Number(rateData.fee_amount) || 0
  } else if (rateData.fee_type === "percentage") {
    feeAmount = (sendAmount * (Number(rateData.fee_amount) || 0)) / 100
  }

  const logisticsFeeAmount =
    fulfillment === "cash_hand" ? computeLogisticsFee(receiveAmount, fulfillment, rateData) : 0
  const totalAmount = roundMoney(sendAmount + feeAmount + logisticsFeeAmount)

  const transaction = await transactionService.create(
    {
      userId: user.id,
      recipientId: fulfillment === "cash_hand" ? null : body.recipientId,
      sendAmount,
      sendCurrency,
      receiveAmount,
      receiveCurrency,
      exchangeRate: rateData.rate,
      feeAmount,
      feeType: rateData.fee_type,
      totalAmount,
      fulfillmentType: fulfillment,
      logisticsFeeAmount,
      logisticsFeeTypeSnapshot: fulfillment === "cash_hand" ? (rateData.logistics_fee_type ?? null) : null,
      deliveryAddressLine: body.deliveryAddressLine ?? null,
      deliveryPhone: body.deliveryPhone ?? null,
      deliveryAddressId: fulfillment === "cash_hand" ? body.deliveryAddressId || null : null,
    },
    user.id,
  )

  try {
    const { EmailNotificationService } = await import("@/lib/email-notification-service")
    await EmailNotificationService.sendTransactionStatusEmail(transaction.transaction_id, "pending")
    await EmailNotificationService.sendAdminTransactionNotification(transaction.transaction_id, "pending")
  } catch (emailError) {
    console.error("Failed to send transaction emails:", emailError)
  }

  return NextResponse.json({ transaction })
})
