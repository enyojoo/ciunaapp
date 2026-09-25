import { marketplaceRoute } from "@/lib/marketplace/http"
import { getOrder, MarketplaceError } from "@/lib/marketplace/service"
import { newAttempt, startAttempt } from "@/lib/marketplace/payments"
export const POST = marketplaceRoute(async (request, ctx, user) => {
  const body = await request.json(),
    id = await newAttempt(ctx.params.id, user.id, body)
  if (body.rail === "yookassa" && body.gatewayMode !== "native")
    try {
      await startAttempt(id)
    } catch (e) {
      if (!(e instanceof MarketplaceError)) throw e
    }
  return { order: await getOrder(ctx.params.id, user.id) }
})
