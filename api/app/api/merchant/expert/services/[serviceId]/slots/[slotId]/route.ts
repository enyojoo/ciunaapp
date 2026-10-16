import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { assertServiceOwned, loadOwnedSlot, parseSlotStatus, SLOT_SELECT } from "@/lib/merchant/expert"
import { audit } from "@/lib/merchant/audit"

export const PATCH = merchantRoute("availability", async (req, { user, merchant }, params) => {
  const service = await assertServiceOwned(merchant.id, params.serviceId, merchant.type)
  const slot = await loadOwnedSlot(service.id, params.slotId)
  const status = parseSlotStatus((await readJson(req)).status)
  assert(slot.status !== "booked", "SLOT_BOOKED", 409)
  assert(slot.status === "available" || slot.status === "blocked", "SLOT_NOT_EDITABLE", 409)
  const { data, error } = await createServerClient().from("expert_service_slots").update({ status, updated_at: new Date().toISOString() }).eq("id", slot.id).eq("status", slot.status).select(SLOT_SELECT).maybeSingle()
  check(error)
  assert(data, "SLOT_BOOKED", 409)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "expert_slot.status_changed", entityType: "expert_service_slot", entityId: slot.id, details: { from: slot.status, to: status } })
  return { slot: data }
})

export const DELETE = merchantRoute("availability", async (_req, { user, merchant }, params) => {
  const service = await assertServiceOwned(merchant.id, params.serviceId, merchant.type)
  const slot = await loadOwnedSlot(service.id, params.slotId)
  assert(slot.status !== "booked", "SLOT_BOOKED", 409)
  const { error } = await createServerClient().from("expert_service_slots").delete().eq("id", slot.id).neq("status", "booked")
  check(error)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "expert_slot.deleted", entityType: "expert_service_slot", entityId: slot.id, details: { serviceId: service.id } })
  return { ok: true }
})
