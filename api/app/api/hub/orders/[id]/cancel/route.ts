import { marketplaceRoute } from "@/lib/marketplace/http"
import { getOrder, transition } from "@/lib/marketplace/service"
export const POST = marketplaceRoute(async (_, ctx, user) => {
  const order = await getOrder(ctx.params.id, user.id)
  await transition(order.id, "cancel", user.id)
  return { order: await getOrder(order.id, user.id) }
})
