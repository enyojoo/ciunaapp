import { adminRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { isUuid } from "@/lib/merchant/office"
import { adminDirectory, listingView, loadSla, selectListings } from "@/lib/merchant/office-data"

export const dynamic = "force-dynamic"

/** One listing for review: details, gallery, translations, seller, owner and SLA. */
export const GET = adminRoute("listings.review", async (_req, admin, params) => {
  assert(isUuid(params.id), "LISTING_NOT_FOUND", 404)
  const db = createServerClient()
  const sla = await loadSla(db)
  const res = await selectListings(db, (select) => db.from("hub_products").select(`${select},long_description,gallery,translations`).eq("id", params.id).maybeSingle() as any)
  check(res.error)
  assert(res.data, "LISTING_NOT_FOUND", 404)
  const dir = await adminDirectory(db, [res.data.review_assigned_to])
  return { listing: listingView(res.data, "review_assigned_to" in res.data, sla, admin.id, dir) }
})
