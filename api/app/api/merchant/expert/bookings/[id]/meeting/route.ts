import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { loadOwnedOrder } from "@/lib/merchant/orders"
import { parseMeeting } from "@/lib/merchant/expert"
import { audit } from "@/lib/merchant/audit"

export const PUT = merchantRoute("orders", async (req, { user, merchant }, params) => {
  const order = await loadOwnedOrder(merchant.id, params.id)
  assert(order.line === "experts", "NOT_A_BOOKING", 409)
  assert(order.payment_state === "paid", "BOOKING_NOT_PAID", 409)
  assert(["awaiting_acceptance", "accepted", "in_progress"].includes(order.fulfillment_state), "BOOKING_CLOSED", 409)
  const { url, instructions } = parseMeeting(await readJson(req))
  const { error } = await createServerClient().rpc("marketplace_event", {
    p_order: order.id,
    p_kind: "meeting_link",
    p_actor: user.id,
    p_message: [url, instructions].filter(Boolean).join("\n"),
    p_visible: true,
    p_details: { meetingUrl: url, instructions },
  })
  check(error)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "expert_booking.meeting_set", entityType: "marketplace_order", entityId: order.id, details: { hasUrl: Boolean(url), hasInstructions: Boolean(instructions) } })
  return { ok: true, meetingUrl: url, instructions }
})
