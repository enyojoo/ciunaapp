import { authedRoute, readJson } from "@/lib/merchant/http"
import { MerchantError } from "@/lib/merchant/errors"
import { rateLimit } from "@/lib/rate-limit"
import { blockersFor, pendingDeletion, requestDeletion, DELETION_WAIT_DAYS } from "@/lib/account-deletion"

export const dynamic = "force-dynamic"

/** What would stop a deletion right now, so the app can say so before asking. */
export const GET = authedRoute(async (_req, user) => {
  const [blockers, pending] = await Promise.all([blockersFor(user.id), pendingDeletion(user.id)])
  return { blockers, pending, waitDays: DELETION_WAIT_DAYS }
})

/** Ask to delete the account: { reason? }. Blocked while an order, transfer or refund is in progress. */
export const POST = authedRoute(async (req, user) => {
  if (!(await rateLimit(`account-delete:${user.id}`, 5, 3600))) throw new MerchantError("RATE_LIMITED", 429)
  const b: Record<string, any> = await readJson(req).catch(() => ({}))
  const reason = typeof b.reason === "string" && b.reason.trim() ? b.reason.trim().slice(0, 500) : null
  const { purgeAfter } = await requestDeletion(user.id, reason)
  return { ok: true, purgeAfter }
})
