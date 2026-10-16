import { adminRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { MerchantError, assert, check } from "@/lib/merchant/errors"
import { isMissingSchema, isUuid } from "@/lib/merchant/office"

/** Delete one of my saved views. Other people's views are never touched. */
export const DELETE = adminRoute("merchants.read", async (_req, admin, params) => {
  assert(isUuid(params.id), "VIEW_NOT_FOUND", 404)
  const { data, error } = await createServerClient().from("office_saved_views").delete().eq("id", params.id).eq("user_id", admin.id).select("id")
  if (error && isMissingSchema(error)) throw new MerchantError("VIEWS_NOT_AVAILABLE", 503)
  check(error)
  assert((data || []).length > 0, "VIEW_NOT_FOUND", 404)
  return { ok: true }
})
