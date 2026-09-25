import { marketplaceRoute } from "@/lib/marketplace/http"
import { getOrder, transition, assert } from "@/lib/marketplace/service"
export const POST = marketplaceRoute(async (request, ctx, user) => {
  const order = await getOrder(ctx.params.id, undefined, true),
    body = await request.json()
  assert(
    [
      "accept",
      "start",
      "fulfill",
      "cancel",
      "refund",
      "restock",
      "reacquire",
      "assign",
      "paid",
      "failed",
    ].includes(body.action),
    "INVALID_ACTION",
    400,
  )
  if (["paid", "failed"].includes(body.action))
    assert(
      order.attempts.some((a) => a.id === body.attemptId && a.rail === "manual"),
      "MANUAL_ATTEMPT_REQUIRED",
      400,
    )
  if (body.action === "paid")
    assert(
      body.amount === order.snapshot.totals.total &&
        body.currency === order.snapshot.totals.payCurrency &&
        String(body.reference || "").trim(),
      "PAYMENT_MISMATCH",
      400,
    )
  await transition(order.id, body.action, user.id, body)
  return { order: await getOrder(order.id, undefined, true) }
}, true)
