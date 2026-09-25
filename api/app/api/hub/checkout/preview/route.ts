import { marketplaceRoute } from "@/lib/marketplace/http"
import { preview } from "@/lib/marketplace/service"
export const POST = marketplaceRoute(async (request, _, user) => ({
  quote: await preview(user.id, await request.json()),
}))
