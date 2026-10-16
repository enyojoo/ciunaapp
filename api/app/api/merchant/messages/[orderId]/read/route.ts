import { merchantRoute } from "@/lib/merchant/http"
import { loadOwnedOrder } from "@/lib/merchant/orders"
import { markRead } from "@/lib/merchant/messages"

export const POST = merchantRoute("messages", async (_req, { merchant }, params) => {
  const order = await loadOwnedOrder(merchant.id, params.orderId)
  return { marked: await markRead(order.id, "merchant") }
})
