import type { MarketplaceOrder } from "@ciuna/shared"

/** Whether the order has a seller to talk to, so the chat can sit beside it on wide screens. */
export function chatAvailableFor(order: MarketplaceOrder): boolean {
  const o = order as MarketplaceOrder & { chat?: { available?: boolean } }
  if (o.chat && typeof o.chat.available === "boolean") return o.chat.available
  return Boolean((order as { merchant_id?: string | null }).merchant_id) && !["awaiting_payment", "expired"].includes(String(order.payment_state))
}
