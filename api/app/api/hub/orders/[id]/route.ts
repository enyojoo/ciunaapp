import { marketplaceRoute } from "@/lib/marketplace/http"
import { getOrder } from "@/lib/marketplace/service"
export const GET = marketplaceRoute(async (_, ctx, user) => ({
  order: await getOrder(ctx.params.id, user.id),
}))
