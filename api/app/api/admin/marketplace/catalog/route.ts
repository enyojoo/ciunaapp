import { marketplaceRoute } from "@/lib/marketplace/http"
import { db, assert, check, validId } from "@/lib/marketplace/service"
export const GET = marketplaceRoute(async () => {
  const [v, z, s, slots, p] = await Promise.all([
    db().from("hub_vendors").select("*").order("name"),
    db().from("marketplace_zones").select("*").order("city"),
    db().from("expert_services").select("*").order("title"),
    db()
      .from("expert_service_slots")
      .select("expert_service_id,slot_start")
      .eq("status", "available")
      .gt("slot_start", new Date().toISOString()),
    db()
      .from("hub_products")
      .select("id,title,vendor_id,fulfillment_mode,fulfillment_type,status,service_line_slug,stock_quantity"),
  ])
  for (const r of [v, z, s, slots, p]) check(r.error)
  return {
    vendors: v.data,
    zones: z.data,
    services: s.data?.map((service) => ({
      ...service,
      upcomingSlots: slots.data?.filter((slot) => slot.expert_service_id === service.id).length || 0,
    })),
    products: p.data,
  }
}, true)
export const POST = marketplaceRoute(async (request) => {
  const b = await request.json(),
    id = b.id ? validId(b.id) : undefined
  if (b.kind === "vendor") {
    assert(id, "INVALID_ID", 400)
    const { error } = await db()
      .from("hub_vendors")
      .update({
        pickup_location: String(b.pickup_location || ""),
        pickup_hours: String(b.pickup_hours || ""),
        fulfillment_notes: String(b.fulfillment_notes || ""),
        owner_team: String(b.owner_team || "operations"),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
    check(error)
  } else if (b.kind === "zone") {
    validId(b.vendor_id)
    assert(
      String(b.city || "").trim() &&
        String(b.district || "").trim() &&
        Number.isFinite(Number(b.fee)) &&
        Number(b.fee) >= 0 &&
        /^[A-Z]{3}$/.test(b.currency),
      "INVALID_ZONE",
      400,
    )
    const row = {
      ...(id ? { id } : {}),
      vendor_id: b.vendor_id,
      city: String(b.city).trim(),
      district: String(b.district).trim(),
      fee: Number(b.fee),
      currency: b.currency,
      active: b.active !== false,
      updated_at: new Date().toISOString(),
    }
    const { error } = await db().from("marketplace_zones").upsert(row)
    check(error)
  } else if (b.kind === "service") {
    assert(id, "INVALID_ID", 400)
    assert(
      [b.booking_lead_minutes, b.payment_cutoff_minutes].every(
        (v) => Number.isInteger(Number(v)) && Number(v) >= 0,
      ),
      "INVALID_TIMING",
      400,
    )
    try {
      new Intl.DateTimeFormat("en", { timeZone: b.timezone })
    } catch {
      assert(false, "INVALID_TIMEZONE", 400)
    }
    assert(["online", "in_person", "both"].includes(b.fulfillment_type), "INVALID_FULFILLMENT", 400)
    const { error } = await db()
      .from("expert_services")
      .update({
        booking_lead_minutes: Number(b.booking_lead_minutes),
        payment_cutoff_minutes: Number(b.payment_cutoff_minutes),
        meeting_instructions: String(b.meeting_instructions || ""),
        timezone: b.timezone,
        fulfillment_type: b.fulfillment_type,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
    check(error)
  } else assert(false, "INVALID_ACTION", 400)
  return { ok: true }
}, true)
