import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"

const KINDS = ["order_new", "booking_new", "message_new", "payout_update", "merchant_status", "listing_review"]

async function snapshot(userId: string, merchantId: string) {
  const db = createServerClient()
  const [prefs, link] = await Promise.all([
    db.from("merchant_notification_prefs").select("email,telegram,muted_kinds").eq("user_id", userId).eq("merchant_id", merchantId).maybeSingle(),
    db.from("telegram_links").select("username,linked_at").eq("user_id", userId).maybeSingle(),
  ])
  check(prefs.error); check(link.error)
  return {
    prefs: prefs.data ?? { email: true, telegram: true, muted_kinds: [] },
    telegram: { linked: Boolean(link.data), username: link.data?.username ?? null, botConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_USERNAME) },
    kinds: KINDS,
  }
}

export const GET = merchantRoute(null, async (_req, { user, merchant }) => snapshot(user.id, merchant.id))

export const PUT = merchantRoute(null, async (req, { user, merchant }) => {
  const b = await readJson(req)
  const muted: string[] = Array.isArray(b.muted_kinds) ? b.muted_kinds : []
  assert(muted.every((k) => KINDS.includes(k)), "KIND_INVALID")
  const { error } = await createServerClient().from("merchant_notification_prefs").upsert({ user_id: user.id, merchant_id: merchant.id, email: b.email !== false, telegram: b.telegram !== false, muted_kinds: Array.from(new Set(muted)) })
  check(error)
  return snapshot(user.id, merchant.id)
})
