import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { assertServiceOwned, blockRange, MAX_TIME_OFF_DAYS, parseRange, requireExpertProfile, validTimeZone } from "@/lib/merchant/expert"
import { audit } from "@/lib/merchant/audit"

/** Holiday mode: block every still-available slot in the range. Date-only values resolve in `timezone` (default UTC). */
export const POST = merchantRoute("availability", async (req, { user, merchant }) => {
  const body = await readJson(req)
  const profile = await requireExpertProfile(merchant)
  const tz = body.timezone ? String(body.timezone) : "UTC"
  assert(validTimeZone(tz), "TIMEZONE_INVALID", 400)
  const { from, to } = parseRange(body.from, body.to, MAX_TIME_OFF_DAYS, tz)
  let serviceIds: string[]
  if (body.serviceId) {
    serviceIds = [(await assertServiceOwned(merchant.id, String(body.serviceId), merchant.type)).id]
  } else {
    const { data, error } = await createServerClient().from("expert_services").select("id").eq("expert_profile_id", profile.id)
    check(error)
    serviceIds = (data || []).map((s: any) => s.id)
  }
  const blocked = await blockRange(serviceIds, from, to)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "expert_time_off.created", entityType: "expert_profile", entityId: profile.id, details: { from: from.toISOString(), to: to.toISOString(), serviceIds, blocked } })
  return { blocked }
})
