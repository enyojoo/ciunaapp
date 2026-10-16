import { createServerClient } from "@/lib/supabase"
import { assert, check } from "./errors"

/** Seller-facing view of marketplace orders. Never exposes payment attempts, provider data or internal notes. */
export type SellerOrderStatus = "new" | "accepted" | "preparing" | "completed" | "cancelled"

export function sellerStatus(o: { fulfillment_state: string; payment_state: string }): SellerOrderStatus {
  switch (o.fulfillment_state) {
    case "awaiting_acceptance":
      return "new"
    case "accepted":
      return "accepted"
    case "in_progress":
      return "preparing"
    case "fulfilled":
      return "completed"
    default:
      return "cancelled"
  }
}

/** Which seller actions are valid right now. Mirrors marketplace_transition in the database. */
export function sellerActions(o: { fulfillment_state: string; payment_state: string; exception_reason: string | null; fulfillment_mode: string; line: string }): string[] {
  if (o.payment_state !== "paid" && o.payment_state !== "refund_pending") return []
  if (o.exception_reason) return []
  switch (o.fulfillment_state) {
    case "awaiting_acceptance":
      return ["accept", "reject"]
    case "accepted":
      return o.line === "experts" ? ["fulfill"] : ["start", "fulfill"]
    case "in_progress":
      return ["fulfill"]
    default:
      return []
  }
}

export function toSellerOrder(o: any) {
  const snap = o.snapshot || {}
  const status = sellerStatus(o)
  return {
    id: o.id,
    publicId: o.public_id,
    line: o.line,
    status,
    paymentState: o.payment_state,
    fulfillmentMode: o.fulfillment_mode,
    createdAt: o.created_at,
    dueAt: o.attention_due_at,
    overdue: Boolean(o.attention_due_at && new Date(o.attention_due_at).getTime() < Date.now() && (status === "new" || status === "accepted" || status === "preparing")),
    title: snap.title,
    items: (snap.lines || []).map((l: any) => ({ id: l.id, title: l.title, quantity: l.quantity, unitPrice: l.unitPrice })),
    totals: snap.totals
      ? {
          currency: snap.totals.productCurrency,
          subtotal: snap.totals.subtotal,
          deliveryFee: snap.totals.deliveryFee,
        }
      : null,
    customer: { name: snap.contactName ?? null, phone: snap.contactPhone ?? null, email: snap.contactEmail ?? null },
    delivery: { address: snap.deliveryAddressLine ?? null, pickupLocation: snap.pickupLocation ?? null, pickupHours: snap.pickupHours ?? null },
    note: snap.note ?? null,
    slot: snap.slotStart ? { start: snap.slotStart, end: snap.slotEnd, timezone: snap.timezone } : null,
    digitalContent: o.digital_content ?? null,
    actions: sellerActions(o),
    exception: o.exception_reason ?? null,
  }
}

/** Load an order only if it belongs to this merchant (id or public id). */
export async function loadOwnedOrder(merchantId: string, id: string) {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  let q = createServerClient().from("marketplace_orders").select("*").eq("merchant_id", merchantId)
  q = uuid.test(id) ? q.eq("id", id) : q.eq("public_id", id.toUpperCase())
  const { data, error } = await q.maybeSingle()
  check(error)
  assert(data, "ORDER_NOT_FOUND", 404)
  return data
}

