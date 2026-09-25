import { marketplaceRoute } from "@/lib/marketplace/http"
import { getOrder, db, assert, check, transition, validId } from "@/lib/marketplace/service"
// Two steps: mint an ownership-scoped upload URL, then attach the uploaded object.
export const POST = marketplaceRoute(async (request, ctx, user) => {
  const order = await getOrder(ctx.params.id, user.id),
    body = await request.json()
  const attempt = order.attempts.find((a) => a.id === body.attemptId)
  assert(
    attempt?.rail === "manual" && ["created", "proof_submitted"].includes(attempt.state),
    "INVALID_TRANSITION",
  )
  if (body.path) {
    const prefix = `marketplace/${user.id}/${order.id}/${attempt.id}/`
    assert(
      typeof body.path === "string" && body.path.startsWith(prefix) && !body.path.includes(".."),
      "INVALID_PROOF",
      400,
    )
    const name = body.path.slice(prefix.length)
    assert(/^[a-f0-9-]+\.(jpg|jpeg|png|pdf)$/.test(name), "INVALID_PROOF", 400)
    const { data, error } = await db()
      .storage.from("transaction-receipts")
      .list(prefix.replace(/\/$/, ""), { search: name })
    check(error)
    const file = data?.find((f) => f.name === name)
    assert(file && file.metadata?.size <= 10 * 1024 * 1024, "INVALID_PROOF", 400)
    await transition(order.id, "proof", user.id, { attemptId: attempt.id, path: body.path })
    return { order: await getOrder(order.id, user.id) }
  }
  assert(["jpg", "jpeg", "png", "pdf"].includes(body.extension), "INVALID_PROOF", 400)
  const path = `marketplace/${user.id}/${order.id}/${validId(attempt.id)}/${crypto.randomUUID()}.${body.extension}`
  const { data, error } = await db().storage.from("transaction-receipts").createSignedUploadUrl(path)
  check(error)
  return { path, signedUrl: data!.signedUrl }
})
