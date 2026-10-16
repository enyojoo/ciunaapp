import { marketplaceRoute } from "@/lib/marketplace/http"
import { getOrder } from "@/lib/marketplace/service"
import { chatState, sellerFor } from "@/lib/merchant/messages"
import { createServerClient } from "@/lib/supabase"

/**
 * The order, plus (additive, optional) `seller` and `chat` for the customer screens. Both are omitted when the
 * database does not have the columns yet, so installed apps keep working unchanged.
 */
export const GET = marketplaceRoute(async (_, ctx, user) => {
  const order = await getOrder(ctx.params.id, user.id)
  const extra: Record<string, unknown> = {}
  try {
    const { data, error } = await createServerClient().from("marketplace_orders").select("merchant_id,payment_state,fulfillment_state,updated_at").eq("id", order.id).maybeSingle()
    if (!error && data) {
      extra.chat = chatState(data as any)
      const seller = await sellerFor(data as any, order.line)
      if (seller) extra.seller = seller
    }
  } catch {
    /* optional fields only */
  }
  return { order: { ...order, ...extra } }
})
