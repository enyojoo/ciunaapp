import { merchantRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"

/** Start linking: returns a one-time deep link the seller opens in Telegram. */
export const POST = merchantRoute(null, async (_req, { user }) => {
  const bot = process.env.TELEGRAM_BOT_USERNAME
  assert(process.env.TELEGRAM_BOT_TOKEN && bot, "TELEGRAM_NOT_CONFIGURED", 503)
  const db = createServerClient()
  await db.from("telegram_link_tokens").delete().eq("user_id", user.id).is("used_at", null)
  const { data, error } = await db.from("telegram_link_tokens").insert({ user_id: user.id }).select("token,expires_at").single()
  check(error)
  return { url: `https://t.me/${bot}?start=${data!.token}`, expiresAt: data!.expires_at }
})

export const DELETE = merchantRoute(null, async (_req, { user }) => {
  const { error } = await createServerClient().from("telegram_links").delete().eq("user_id", user.id)
  check(error)
  return { ok: true }
})
