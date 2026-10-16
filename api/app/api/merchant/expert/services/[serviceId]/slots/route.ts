import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { assertServiceOwned, MAX_SLOT_RANGE_DAYS, parseRange, parseSlotInput, SLOT_SELECT } from "@/lib/merchant/expert"
import { audit } from "@/lib/merchant/audit"

export const GET = merchantRoute("availability", async (req, { merchant }, params) => {
  const service = await assertServiceOwned(merchant.id, params.serviceId, merchant.type)
  const sp = new URL(req.url).searchParams
  const now = new Date()
  const { from, to } = parseRange(sp.get("from"), sp.get("to"), MAX_SLOT_RANGE_DAYS, "UTC", { from: now, to: new Date(now.getTime() + 14 * 86_400_000) })
  const { data, error } = await createServerClient().from("expert_service_slots").select(SLOT_SELECT).eq("expert_service_id", service.id).gte("slot_start", from.toISOString()).lt("slot_start", to.toISOString()).order("slot_start", { ascending: true })
  check(error)
  return { slots: data || [] }
})

export const POST = merchantRoute("availability", async (req, { user, merchant }, params) => {
  const service = await assertServiceOwned(merchant.id, params.serviceId, merchant.type)
  const { start, end } = parseSlotInput(await readJson(req))
  const server = createServerClient()
  const { count, error: oe } = await server
    .from("expert_service_slots")
    .select("id", { count: "exact", head: true })
    .eq("expert_service_id", service.id)
    .in("status", ["available", "booked", "blocked"])
    .lt("slot_start", end.toISOString())
    .gt("slot_end", start.toISOString())
  check(oe)
  assert(!count, "SLOT_OVERLAP", 409)
  const { data, error } = await server.from("expert_service_slots").insert({ expert_service_id: service.id, slot_start: start.toISOString(), slot_end: end.toISOString(), status: "available", source: "manual", updated_at: new Date().toISOString() }).select(SLOT_SELECT).single()
  check(error)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "expert_slot.created", entityType: "expert_service_slot", entityId: data!.id, details: { serviceId: service.id } })
  return { slot: data }
})
