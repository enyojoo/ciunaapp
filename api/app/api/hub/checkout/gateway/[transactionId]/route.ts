import { marketplaceRoute } from "@/lib/marketplace/http"
import { getOrder, assert, MarketplaceError, db, check } from "@/lib/marketplace/service"
import { startAttempt, reconcileAttempt } from "@/lib/marketplace/payments"
export const GET = marketplaceRoute(async (_, ctx, user) => {
  let order
  try {
    order = await getOrder(ctx.params.transactionId, user.id)
  } catch (e) {
    if (!(e instanceof MarketplaceError) || e.code !== "ORDER_NOT_FOUND") throw e
    // Historical transactions remain readable; no new legacy payment can be created here.
    const { data, error } = await db()
      .from("transactions")
      .select("transaction_id,status,total_amount,send_currency")
      .eq("user_id", user.id)
      .eq("transaction_id", ctx.params.transactionId.toUpperCase())
      .maybeSingle()
    check(error)
    assert(data, "ORDER_NOT_FOUND", 404)
    return {
      transactionId: data.transaction_id,
      status: data.status,
      amount: data.total_amount,
      currency: data.send_currency,
      confirmationToken: null,
    }
  }
  const a = order.attempts[0]
  if (a?.rail === "yookassa")
    try {
      await reconcileAttempt(a.id)
    } catch {
      /* Worker retains recovery responsibility. */
    }
  order = await getOrder(order.id, user.id)
  const current = order.attempts[0]
  return {
    transactionId: order.public_id,
    attemptId: current?.id,
    status: ["paid", "refund_pending", "refunded"].includes(order.payment_state)
      ? "completed"
      : current?.state === "failed"
        ? "failed"
        : "pending",
    confirmationToken: current?.confirmation_token || null,
    confirmationUrl: current?.confirmation_url || null,
    amount: order.snapshot.totals.total,
    currency: order.snapshot.totals.payCurrency,
    order,
  }
})
export const POST = marketplaceRoute(async (request, ctx, user) => {
  const order = await getOrder(ctx.params.transactionId, user.id),
    body = await request.json()
  const a = order.attempts.find((a) => a.id === body.attemptId)
  assert(a?.rail === "yookassa" && a.confirmation_mode === "native", "INVALID_ATTEMPT", 400)
  assert(typeof body.paymentToken === "string", "PAYMENT_TOKEN_REQUIRED", 400)
  try {
    await startAttempt(
      a.id,
      body.paymentToken,
      ["BANK_CARD", "SBERBANK", "YOO_MONEY", "SBP"].includes(body.paymentType) ? body.paymentType : undefined,
    )
  } catch (e) {
    if (!(e instanceof MarketplaceError)) throw e
  }
  const updated = await getOrder(order.id, user.id),
    current = updated.attempts.find((x) => x.id === a.id)
  return { order: updated, gateway: { confirmationUrl: current?.confirmation_url } }
})
