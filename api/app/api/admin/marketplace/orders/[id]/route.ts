import { marketplaceRoute } from "@/lib/marketplace/http"
import { db, check, getOrder } from "@/lib/marketplace/service"
export const GET = marketplaceRoute(async (_, ctx) => {
  const order = await getOrder(ctx.params.id, undefined, true)
  const { data: refunds, error } = await db().from("marketplace_refunds").select("*").eq("order_id", order.id)
  check(error)
  const proofs = await Promise.all(
    order.attempts
      .filter((a) => a.proof_path)
      .map(async (a) => {
        const { data, error } = await db()
          .storage.from("transaction-receipts")
          .createSignedUrl(a.proof_path!, 300)
        check(error)
        return { attemptId: a.id, url: data!.signedUrl }
      }),
  )
  return { order, refunds, proofs }
}, true)
