"use client"
import * as React from "react"
import { useToast } from "@ciuna/ui-web"
import { api, ApiError } from "@/lib/api"
import { invalidate } from "@/lib/query"
import { useErrorText, useT } from "@/lib/i18n"
import type { SellerOrder } from "./format"

export type OrderActionName = "accept" | "start" | "fulfill" | "reject"
export interface OrderActionPayload { reason?: string; note?: string; digitalContent?: string }
export type OrderActionResult = { ok: true; order: SellerOrder } | { ok: false; code: string; message: string }

/** Runs a seller action, shows the toast, and drops cached order lists so every screen refetches. */
export function useOrderAction() {
  const { t } = useT()
  const errText = useErrorText()
  const toast = useToast()
  const [busy, setBusy] = React.useState<string | null>(null)

  const run = React.useCallback(
    async (orderId: string, action: OrderActionName, payload: OrderActionPayload = {}, opts: { silent?: boolean } = {}): Promise<OrderActionResult> => {
      setBusy(`${orderId}:${action}`)
      try {
        const res = await api<{ order: SellerOrder }>(`/api/merchant/orders/${encodeURIComponent(orderId)}/actions`, { method: "POST", json: { action, ...payload } })
        invalidate("orders:")
        if (!opts.silent) toast.show(t(`orders.toast.${action}`, { id: res.order.publicId }))
        return { ok: true, order: res.order }
      } catch (e) {
        const code = e instanceof ApiError ? e.code : "UNAVAILABLE"
        const message = errText(code)
        toast.show(message, "error")
        return { ok: false, code, message }
      } finally {
        setBusy(null)
      }
    },
    [t, errText, toast],
  )
  return { run, busy }
}
