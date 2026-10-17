import { authedRoute, readJson } from "@/lib/merchant/http"
import { MerchantError, check } from "@/lib/merchant/errors"
import { rateLimit } from "@/lib/rate-limit"
import { createServerClient } from "@/lib/supabase"
import { isExpoPushToken } from "@/lib/push"

/** Register this device for notifications. A token that was on another account moves to this one. */
export const POST = authedRoute(async (req, user) => {
  if (!(await rateLimit(`push:${user.id}`, 30, 60))) throw new MerchantError("RATE_LIMITED", 429)
  const b = await readJson(req)
  if (!isExpoPushToken(b.token)) throw new MerchantError("PUSH_TOKEN_INVALID", 400)
  const platform = b.platform === "ios" || b.platform === "android" || b.platform === "web" ? b.platform : null
  if (!platform) throw new MerchantError("PUSH_PLATFORM_INVALID", 400)
  const { error } = await createServerClient().from("push_tokens").upsert({ user_id: user.id, token: b.token, platform, enabled: true, last_seen_at: new Date().toISOString() }, { onConflict: "token" })
  check(error)
  return { ok: true }
})

/** Stop notifications on this device (for example on sign-out). */
export const DELETE = authedRoute(async (req, user) => {
  const b = await readJson(req)
  if (!isExpoPushToken(b.token)) throw new MerchantError("PUSH_TOKEN_INVALID", 400)
  check((await createServerClient().from("push_tokens").delete().eq("token", b.token).eq("user_id", user.id)).error)
  return { ok: true }
})
