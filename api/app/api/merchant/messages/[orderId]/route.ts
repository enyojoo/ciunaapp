import { rateLimit, LIMITS } from "@/lib/rate-limit"
import { assert } from "@/lib/merchant/errors"
import { merchantRoute, readJson } from "@/lib/merchant/http"
import { loadOwnedOrder, sellerStatus } from "@/lib/merchant/orders"
import { firstName, parseAfter, preview, sendMessage, threadFor } from "@/lib/merchant/messages"
import { notifyChatMessage } from "@/lib/push-events"

export const GET = merchantRoute("messages", async (req, { merchant }, params) => {
  const order = await loadOwnedOrder(merchant.id, params.orderId)
  const thread = await threadFor(order, parseAfter(new URL(req.url).searchParams.get("after")))
  return { ...thread, order: { id: order.id, publicId: order.public_id, customerName: firstName(order.snapshot?.contactName), status: sellerStatus(order) } }
})

export const POST = merchantRoute("messages", async (req, { merchant, user }, params) => {
  assert(await rateLimit(`message:${user.id}`, LIMITS.message.limit, LIMITS.message.windowSeconds), "RATE_LIMITED", 429)
  const order = await loadOwnedOrder(merchant.id, params.orderId)
  const body = await readJson(req)
  const message = await sendMessage(order.id, "merchant", user.id, body.body, body.language)
  await notifyChatMessage(order.id, preview(message.body))
  return { message }
})
