import { authedRoute, readJson } from "@/lib/merchant/http"
import { MerchantError } from "@/lib/merchant/errors"
import { LIMITS, rateLimit } from "@/lib/rate-limit"
import { sendReply, threadForUser, validateBody } from "@/lib/support"

export const POST = authedRoute(async (req, user, params) => {
  if (!(await rateLimit(`support:${user.id}`, LIMITS.support.limit, LIMITS.support.windowSeconds))) throw new MerchantError("RATE_LIMITED", 429)
  const id = String(params.id)
  await threadForUser(user.id, id) // owner check: anyone else gets "not found"
  const body = validateBody((await readJson(req))?.body)
  return { id: await sendReply("customer", id, user.id, body) }
})
