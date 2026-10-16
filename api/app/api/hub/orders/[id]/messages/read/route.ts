import { marketplaceRoute } from "@/lib/marketplace/http"
import { MarketplaceError } from "@/lib/marketplace/service"
import { MerchantError } from "@/lib/merchant/errors"
import { loadCustomerOrder, markRead } from "@/lib/merchant/messages"

export const POST = marketplaceRoute(async (_request, ctx, user) => {
  try {
    const order = await loadCustomerOrder(user.id, ctx.params.id)
    return { marked: await markRead(order.id, "customer") }
  } catch (e) {
    if (e instanceof MerchantError) throw new MarketplaceError(e.code, e.status)
    throw e
  }
})
