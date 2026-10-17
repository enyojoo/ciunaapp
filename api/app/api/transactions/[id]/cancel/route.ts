import { authedRoute } from "@/lib/merchant/http"
import { MerchantError, check } from "@/lib/merchant/errors"
import { rateLimit } from "@/lib/rate-limit"
import { createServerClient } from "@/lib/supabase"
import { interpretCancel } from "@/lib/transfer-cancel"

export const dynamic = "force-dynamic"

/** Cancel a transfer that is still waiting for payment. Nothing was charged, so nothing is refunded. */
export const POST = authedRoute(async (_req, user, params) => {
  if (!(await rateLimit(`transfer-cancel:${user.id}`, 10, 3600))) throw new MerchantError("RATE_LIMITED", 429)
  const { data, error } = await createServerClient().rpc("cancel_transfer", { p_user: user.id, p_transaction: params.id })
  check(error)
  interpretCancel(data)
  return { ok: true }
})
