"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { AlertCircle, Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import {
  prefetchCheckoutQuote,
  warmCartCheckout,
} from "@ciuna/shared/marketplace/checkout-warm"
import { AppPageHeader } from "@/components/layout/app-page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { prefetchYooKassaWidgetScript } from "@/components/yookassa-checkout-widget"
import { fetchWithAuth } from "@/lib/fetch-with-auth"
import { useAuth } from "@/lib/auth-context"
import { useHubCartByLine, removeHubCartItem, updateHubCartItemQuantity } from "@/lib/hub-cart-client"
import { hubCartCheckoutPath, hubLineHomePath } from "@/lib/hub-public-paths"
import { hubProductEffectivePrice } from "@/lib/hub-product-price"
import { formatCurrency } from "@/utils/currency"

export function HubCartPage({ lineSlug }: { lineSlug: "food" | "mart" }) {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { userProfile } = useAuth()
  const { cart, loading } = useHubCartByLine(lineSlug)
  const [pendingItemId, setPendingItemId] = useState<string | null>(null)

  const items = cart?.items || []
  const availableItems = items.filter((i) => !i.unavailable && i.product)
  const unavailableItems = items.filter((i) => i.unavailable)

  const currency = availableItems[0]?.product?.fixed_currency || ""
  const subtotal = availableItems.reduce((sum, i) => sum + hubProductEffectivePrice(i.product!) * i.quantity, 0)
  const fingerprint = useMemo(
    () =>
      (cart?.items || [])
        .map((i) => `${i.hub_product_id}:${i.quantity}`)
        .sort()
        .join("|"),
    [cart?.items],
  )

  useEffect(() => {
    prefetchYooKassaWidgetScript()
  }, [])

  useEffect(() => {
    if (!cart?.id || !fingerprint || availableItems.length === 0) return
    void prefetchCheckoutQuote({
      cartId: cart.id,
      fingerprint,
      fetcher: fetchWithAuth,
    })
  }, [cart?.id, fingerprint, availableItems.length])

  const onQuantityChange = async (itemId: string, quantity: number) => {
    if (!cart) return
    setPendingItemId(itemId)
    try {
      await updateHubCartItemQuantity(cart.vendor_id, itemId, quantity)
    } finally {
      setPendingItemId(null)
    }
  }

  const onRemove = async (itemId: string) => {
    if (!cart) return
    setPendingItemId(itemId)
    try {
      await removeHubCartItem(cart.vendor_id, itemId)
    } finally {
      setPendingItemId(null)
    }
  }

  const goCheckout = () => {
    if (!cart?.id || availableItems.length === 0) return
    const contactName =
      [userProfile?.first_name, userProfile?.last_name].filter(Boolean).join(" ") ||
      userProfile?.email?.split("@")[0] ||
      ""
    void warmCartCheckout({
      cartId: cart.id,
      fingerprint,
      fetcher: fetchWithAuth,
      uuid: () => crypto.randomUUID(),
      gatewayMode: "embedded",
      contactName,
      contactPhone: userProfile?.phone || "",
    })
    router.push(hubCartCheckoutPath(lineSlug))
  }

  const backHref = hubLineHomePath(lineSlug)

  if (loading && !cart) {
    return (
      <div className="min-w-0 space-y-0">
        <AppPageHeader title={t("hub.cart.title", { defaultValue: "Cart" })} backHref={backHref} />
        <div className="px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-2xl animate-pulse space-y-3">
            <div className="h-24 rounded-xl bg-gray-100" />
            <div className="h-24 rounded-xl bg-gray-100" />
          </div>
        </div>
      </div>
    )
  }

  if (!cart || items.length === 0) {
    return (
      <div className="min-w-0 space-y-0">
        <AppPageHeader title={t("hub.cart.title", { defaultValue: "Cart" })} backHref={backHref} />
        <div className="px-4 py-16 sm:px-6">
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
            <ShoppingBag className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-muted-foreground">
              {t("hub.cart.empty", { defaultValue: "Your cart is empty." })}
            </p>
            <Button asChild variant="outline">
              <Link href={backHref}>{t("hub.cart.browse", { defaultValue: "Start browsing" })}</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-w-0 space-y-0">
      <AppPageHeader
        title={t("hub.cart.titleWithVendor", { defaultValue: "Cart · {{vendor}}", vendor: cart.vendor?.name || "" })}
        backHref={backHref}
      />
      <div className="min-w-0 px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {unavailableItems.length > 0 ? (
            <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                {t("hub.cart.someUnavailable", {
                  defaultValue: "Some items are no longer available and were left out of your total: {{titles}}",
                  titles: unavailableItems.map((i) => i.product?.title || i.hub_product_id).join(", "),
                })}
              </p>
            </div>
          ) : null}

          <Card>
            <CardContent className="divide-y p-0">
              {availableItems.map((item) => {
                const product = item.product!
                const unitPrice = hubProductEffectivePrice(product)
                const isPending = pendingItemId === item.id
                return (
                  <div key={item.id} className="flex items-center gap-3 p-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.title} className="h-full w-full object-contain" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{product.title}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(unitPrice, product.fixed_currency || "")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 items-center rounded-lg border border-gray-200">
                        <button
                          type="button"
                          aria-label={t("hub.cart.decrease", { defaultValue: "Decrease quantity" })}
                          className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                          disabled={isPending}
                          onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium tabular-nums">
                          {isPending ? <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" /> : item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={t("hub.cart.increase", { defaultValue: "Increase quantity" })}
                          className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                          disabled={isPending}
                          onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        aria-label={t("hub.cart.remove", { defaultValue: "Remove item" })}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        disabled={isPending}
                        onClick={() => onRemove(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <span className="text-sm font-medium text-gray-700">{t("hub.cart.subtotal", { defaultValue: "Subtotal" })}</span>
              <span className="text-lg font-bold tabular-nums">{formatCurrency(subtotal, currency)}</span>
            </CardContent>
          </Card>

          <Button
            className="h-12 w-full rounded-xl text-sm font-semibold"
            disabled={availableItems.length === 0}
            onClick={goCheckout}
          >
            {t("hub.cart.checkout", { defaultValue: "Checkout" })}
          </Button>
        </div>
      </div>
    </div>
  )
}
