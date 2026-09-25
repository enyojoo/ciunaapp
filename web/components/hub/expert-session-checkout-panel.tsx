"use client"
import type { MutableRefObject } from "react"
import { MarketplaceCheckout } from "./marketplace-checkout"
export function ExpertSessionCheckoutPanel({
  preflight,
}: {
  preflight: { slot: { id: string }; service: unknown; profile: unknown }
  idempotencyKeyRef: MutableRefObject<string>
  onQuoteBooking: (opts: { message: string }) => Promise<void>
}) {
  return <MarketplaceCheckout source={{ kind: "expert", expertServiceSlotId: preflight.slot.id }} />
}
