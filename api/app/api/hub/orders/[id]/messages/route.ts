import { marketplaceRoute } from "@/lib/marketplace/http"
import { MarketplaceError } from "@/lib/marketplace/service"
import { MerchantError } from "@/lib/merchant/errors"
import { loadCustomerOrder, parseAfter, sendMessage, threadFor } from "@/lib/merchant/messages"

async function guarded<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    if (e instanceof MerchantError) throw new MarketplaceError(e.code, e.status)
    throw e
  }
}

export const GET = marketplaceRoute((request, ctx, user) =>
  guarded(async () => {
    const order = await loadCustomerOrder(user.id, ctx.params.id)
    return threadFor(order, parseAfter(new URL(request.url).searchParams.get("after")))
  }),
)

export const POST = marketplaceRoute((request, ctx, user) =>
  guarded(async () => {
    const order = await loadCustomerOrder(user.id, ctx.params.id)
    const body = await request.json()
    const message = await sendMessage(order.id, "customer", user.id, body?.body, body?.language)
    return { message }
  }),
)
