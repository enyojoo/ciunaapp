"use client"

import Link from "next/link"
import { useTranslation } from "react-i18next"
import { ShoppingCart } from "lucide-react"
import { hubCartItemCount, hubCartSubtotal, useHubCart } from "@/lib/hub-cart-client"
import { hubCartPath } from "@/lib/hub-public-paths"
import { formatCurrency } from "@/utils/currency"

/**
 * Persistent floating bar shown on Food/Mart storefront + catalog pages once the vendor's cart
 * has items. Sits above the mobile bottom tab bar (`--app-bottom-nav-height`) and the home
 * indicator safe area.
 */
export function HubCartBar({ lineSlug, vendorId }: { lineSlug: string; vendorId: string | null | undefined }) {
  const { t } = useTranslation("app")
  const { cart } = useHubCart(vendorId)
  const count = hubCartItemCount(cart)

  if (!vendorId || !cart || count <= 0) return null

  const subtotal = hubCartSubtotal(cart)

  return (
    <div
      className="fixed inset-x-3 z-50 sm:inset-x-auto sm:right-6 sm:w-96"
      style={{ bottom: "calc(var(--app-bottom-nav-height, 0px) + var(--safe-area-inset-bottom, 0px) + 12px)" }}
    >
      <Link
        href={hubCartPath(lineSlug)}
        className="flex items-center justify-between gap-3 rounded-2xl bg-gray-900 px-4 py-3 text-white shadow-[0_12px_32px_rgba(15,23,42,0.35)] transition-transform active:scale-[0.98]"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <ShoppingCart className="h-4 w-4" />
          {t("hub.cart.viewCart", { defaultValue: "View cart" })} · {t("hub.cart.itemCount", { defaultValue: "{{count}} item", count })}
        </span>
        {subtotal ? (
          <span className="text-sm font-bold tabular-nums">{formatCurrency(subtotal.amount, subtotal.currency)}</span>
        ) : null}
      </Link>
    </div>
  )
}
