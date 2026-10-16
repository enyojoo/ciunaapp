import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useToast } from "@/components/toast-provider"
import { addToHubCart, getLineCart } from "@/lib/hub-cart"
import type { HubProduct } from "@/lib/types"

type AddParams = {
  vendorId: string
  serviceLineSlug: "food" | "mart"
  hubProductId: string
  product?: HubProduct | null
}

/**
 * Adds to the cart, but never clears another store's cart silently: when the line already holds a
 * different store's items it asks first (Start new cart / Keep current cart). Render `dialog`.
 */
export function useGuardedAdd() {
  const { t } = useTranslation("app")
  const { showError } = useToast()
  const [pending, setPending] = useState<{ params: AddParams; vendor: string } | null>(null)

  const run = (params: AddParams) => {
    void addToHubCart(params).catch((e) => {
      showError(e instanceof Error ? e.message : t("hub.cart.addFailed", { defaultValue: "Couldn't add to cart" }))
    })
  }

  const add = (params: AddParams) => {
    const held = getLineCart(params.serviceLineSlug)
    if (held && held.vendor_id !== params.vendorId && held.items.length > 0) {
      setPending({ params, vendor: held.vendor?.name || "" })
      return
    }
    run(params)
  }

  const dialog = pending ? (
    <ConfirmDialog
      open
      title={t("hub.cart.lockTitle", { defaultValue: "Start a new cart?" })}
      description={t("hub.cart.lockBody", {
        vendor: pending.vendor,
        defaultValue: "Your cart has items from {{vendor}}. A cart holds one store, so adding this will clear it.",
      })}
      confirmLabel={t("hub.cart.lockConfirm", { defaultValue: "Start new cart" })}
      cancelLabel={t("hub.cart.lockCancel", { defaultValue: "Keep current cart" })}
      onCancel={() => setPending(null)}
      onConfirm={() => {
        const next = pending.params
        setPending(null)
        run(next)
      }}
    />
  ) : null

  return { add, dialog }
}
