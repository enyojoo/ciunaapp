import { authedRoute, readJson } from "@/lib/merchant/http"
import { MerchantError } from "@/lib/merchant/errors"
import { LIMITS, rateLimit } from "@/lib/rate-limit"
import { createRequest, listForUser, validateNewRequest } from "@/lib/support"

export const dynamic = "force-dynamic"

/** The signed-in customer's requests. ?status=open|resolved */
export const GET = authedRoute(async (req, user) => ({
  requests: await listForUser(user.id, new URL(req.url).searchParams.get("status")),
}))

/** Open a request with its first message. */
export const POST = authedRoute(async (req, user) => {
  if (!(await rateLimit(`support:${user.id}`, LIMITS.support.limit, LIMITS.support.windowSeconds))) throw new MerchantError("RATE_LIMITED", 429)
  const id = await createRequest(user.id, validateNewRequest(await readJson(req)))
  return { id }
})
