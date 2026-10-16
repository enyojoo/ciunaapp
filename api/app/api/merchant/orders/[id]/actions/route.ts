import { merchantRoute, readJson } from "@/lib/merchant/http"
import { assert, MerchantError } from "@/lib/merchant/errors"
import { toSellerOrder, sellerActions, loadOwnedOrder } from "@/lib/merchant/orders"
import { transition, MarketplaceError } from "@/lib/marketplace/service"
import { createServerClient } from "@/lib/supabase"
import { audit } from "@/lib/merchant/audit"
import { recordEarningForOrder, snapshotOrderFee } from "@/lib/merchant/money"

/** accept | start | fulfill | reject. Drives the same state machine Office uses (marketplace_transition). */
export const POST = merchantRoute(
  "orders",
  async (req, { user, merchant }, params) => {
    const body = await readJson(req)
    const action = String(body.action)
    assert(["accept", "start", "fulfill", "reject"].includes(action), "INVALID_ACTION")
    const order = await loadOwnedOrder(merchant.id, params.id)
    assert(sellerActions(order).includes(action), action === "reject" ? "REJECT_NOT_ALLOWED" : "INVALID_TRANSITION", 409, { state: order.fulfillment_state })

    const data: Record<string, unknown> = {}
    let dbAction = action
    if (action === "reject") {
      const reason = String(body.reason || "").trim().slice(0, 500)
      assert(reason.length >= 3, "REASON_REQUIRED", 422)
      dbAction = "cancel"
      data.reason = `Rejected by seller: ${reason}`
    }
    if (action === "fulfill") {
      data.note = String(body.note || "").trim().slice(0, 1000)
      if (order.fulfillment_mode === "digital") data.digitalContent = String(body.digitalContent || "").trim().slice(0, 8000)
    }
    try {
      await transition(order.id, dbAction, user.id, data)
    } catch (e) {
      if (e instanceof MarketplaceError) throw new MerchantError(e.code, e.status)
      throw e
    }
    if (action === "accept") await snapshotOrderFee(order.id)
    if (action === "fulfill") await recordEarningForOrder(order.id)
    await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: `order.${action}`, entityType: "marketplace_order", entityId: order.id, details: action === "reject" ? { reason: data.reason } : {} })
    const { data: fresh } = await createServerClient().from("marketplace_orders").select("*").eq("id", order.id).single()
    return { order: toSellerOrder(fresh) }
  },
  { allowStatuses: ["live", "paused"] },
)
