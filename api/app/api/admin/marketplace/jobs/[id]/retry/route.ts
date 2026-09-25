import { marketplaceRoute } from "@/lib/marketplace/http"
import { db, check, validId } from "@/lib/marketplace/service"
export const POST = marketplaceRoute(async (_, ctx, user) => {
  const { error } = await db().rpc("marketplace_retry_job", {
    p_job: validId(ctx.params.id),
    p_actor: user.id,
  })
  check(error)
  return { ok: true }
}, true)
