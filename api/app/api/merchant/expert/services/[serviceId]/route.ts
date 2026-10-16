import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { assertServiceOwned, buildSellerService, serviceContentChanged } from "@/lib/merchant/expert"
import { audit } from "@/lib/merchant/audit"

export const GET = merchantRoute("catalog", async (_req, { merchant }, params) => ({ service: await assertServiceOwned(merchant.id, params.serviceId, merchant.type) }))

export const PATCH = merchantRoute("catalog", async (req, { user, merchant }, params) => {
  assert(merchant.status !== "suspended", "MERCHANT_SUSPENDED", 403)
  const existing = await assertServiceOwned(merchant.id, params.serviceId, merchant.type)
  const row: Record<string, any> = buildSellerService(await readJson(req), existing.expert_profile_id, existing)
  const contentChanged = serviceContentChanged(row, existing)
  if (contentChanged) row.review_status = "pending"
  if (row.is_published) {
    assert(merchant.status === "live", "MERCHANT_NOT_LIVE", 409)
    assert(existing.review_status !== "rejected" || contentChanged, "LISTING_REJECTED", 409)
  }
  const { data, error } = await createServerClient().from("expert_services").update(row).eq("id", existing.id).select("*").single()
  check(error)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "expert_service.updated", entityType: "expert_service", entityId: existing.id, details: { published: row.is_published, contentChanged } })
  return { service: data }
})

/** Delete = unpublish + keep the row (bookings reference it). Refused while future booked slots exist. */
export const DELETE = merchantRoute("catalog", async (_req, { user, merchant }, params) => {
  const existing = await assertServiceOwned(merchant.id, params.serviceId, merchant.type)
  const server = createServerClient()
  const { count, error: ce } = await server.from("expert_service_slots").select("id", { count: "exact", head: true }).eq("expert_service_id", existing.id).eq("status", "booked").gt("slot_end", new Date().toISOString())
  check(ce)
  assert(!count, "HAS_FUTURE_BOOKINGS", 409, { count })
  const { error } = await server.from("expert_services").update({ is_published: false, updated_at: new Date().toISOString() }).eq("id", existing.id)
  check(error)
  const { error: de } = await server.from("expert_service_slots").delete().eq("expert_service_id", existing.id).eq("status", "available").gt("slot_start", new Date().toISOString())
  check(de)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "expert_service.archived", entityType: "expert_service", entityId: existing.id })
  return { ok: true }
})
