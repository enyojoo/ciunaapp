import { merchantRoute } from "@/lib/merchant/http"
import { resolveKybProfile } from "@/lib/merchant/service"

/** Requirements for each tier, resolved from the merchant's country and type. */
export const GET = merchantRoute(null, async (_req, { merchant }) => {
  const [t1, t2] = await Promise.all([resolveKybProfile(merchant.country, merchant.type, 1), resolveKybProfile(merchant.country, merchant.type, 2)])
  return { tiers: [t1, t2].filter(Boolean) }
})
