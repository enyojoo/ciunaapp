import { marketplaceRoute } from "@/lib/marketplace/http"
import { submit, getOrder, MarketplaceError } from "@/lib/marketplace/service"
import { startAttempt } from "@/lib/marketplace/payments"
export const POST = marketplaceRoute(async (request, _, user) => {
  const id = await submit(user, await request.json())
  let order = await getOrder(id, user.id)
  const a = order.attempts[0]
  if (a?.rail === "yookassa" && a.confirmation_mode === "embedded" && a.state === "created") {
    try {
      await startAttempt(a.id)
    } catch (e) {
      if (!(e instanceof MarketplaceError)) throw e
    }
    order = await getOrder(id, user.id)
  }
  return { order }
})
