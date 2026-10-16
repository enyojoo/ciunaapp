import { adminRoute, readJson } from "@/lib/merchant/http"
import { claimItem } from "@/lib/merchant/office-data"

/** Claim a merchant application for me, or release it ({ "release": true }). Two admins at once: the second gets 409 CLAIMED_BY_OTHER. */
export const POST = adminRoute("merchants.review", async (req, admin, params) => {
  const body = await readJson(req).catch(() => ({} as Record<string, any>))
  return claimItem("merchant", params.id, admin, { release: body.release === true })
})
