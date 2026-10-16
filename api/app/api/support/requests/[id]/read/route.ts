import { authedRoute } from "@/lib/merchant/http"
import { markRead, threadForUser } from "@/lib/support"

export const POST = authedRoute(async (_req, user, params) => {
  const id = String(params.id)
  await threadForUser(user.id, id)
  await markRead(id, "customer")
  return { ok: true }
})
