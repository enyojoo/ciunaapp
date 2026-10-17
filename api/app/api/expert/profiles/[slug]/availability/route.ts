import { authedRoute } from "@/lib/merchant/http"
import { MerchantError, check } from "@/lib/merchant/errors"
import { rateLimit } from "@/lib/rate-limit"
import { createServerClient } from "@/lib/supabase"
import { nextAvailableFor, publishedProfileId } from "@/lib/expert-alerts"

export const dynamic = "force-dynamic"

/** When this expert is next bookable, and whether the customer asked to be told when times appear. */
export const GET = authedRoute(async (_req, user, params) => {
  const id = await publishedProfileId(params.slug)
  const next = (await nextAvailableFor([id])).get(id) ?? null
  const { data } = await createServerClient().from("expert_slot_alerts").select("user_id").eq("user_id", user.id).eq("expert_profile_id", id).maybeSingle()
  return { nextAvailableAt: next, alerting: Boolean(data) }
})

/** Ask to be told when this expert has open times. */
export const POST = authedRoute(async (_req, user, params) => {
  if (!(await rateLimit(`slot-alert:${user.id}`, 30, 3600))) throw new MerchantError("RATE_LIMITED", 429)
  const id = await publishedProfileId(params.slug)
  check((await createServerClient().from("expert_slot_alerts").upsert({ user_id: user.id, expert_profile_id: id }, { onConflict: "user_id,expert_profile_id" })).error)
  return { ok: true }
})

export const DELETE = authedRoute(async (_req, user, params) => {
  const id = await publishedProfileId(params.slug)
  check((await createServerClient().from("expert_slot_alerts").delete().eq("user_id", user.id).eq("expert_profile_id", id)).error)
  return { ok: true }
})
