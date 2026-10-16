import { adminRoute, readJson } from "@/lib/merchant/http"
import { claimItem } from "@/lib/merchant/office-data"

/** Claim a listing in review for me, or release it ({ "release": true }). A second claimer gets 409 CLAIMED_BY_OTHER. */
export const POST = adminRoute("listings.review", async (req, admin, params) => {
  const body = await readJson(req).catch(() => ({} as Record<string, any>))
  return claimItem("listing", params.id, admin, { release: body.release === true })
})
