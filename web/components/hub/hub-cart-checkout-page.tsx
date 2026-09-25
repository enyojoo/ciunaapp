"use client"
import { useAuth } from "@/lib/auth-context"
import { useEffect, useMemo, useState } from "react"
import { useHubCartByLine } from "@/lib/hub-cart-client"
import { MarketplaceCheckout } from "./marketplace-checkout"
import { useTranslation } from "react-i18next"

function cartSeed(cart: {
  vendor?: { name?: string | null } | null
  items: Array<{
    id: string
    quantity: number
    unavailable?: boolean
    product?: {
      title: string
      sale_price?: number | null
      list_price?: number | null
      fixed_amount?: number | null
      fixed_currency?: string | null
      default_input_currency?: string | null
    } | null
  }>
}) {
  const lines = cart.items
    .filter((i) => !i.unavailable && i.product)
    .map((i) => {
      const p = i.product!
      const sale = Number(p.sale_price)
      const unit =
        Number.isFinite(sale) && sale > 0
          ? sale
          : Number(p.list_price || p.fixed_amount || 0)
      return {
        id: i.id,
        quantity: i.quantity,
        title: p.title,
        unitPrice: unit,
      }
    })
  const currency =
    cart.items.find((i) => i.product)?.product?.fixed_currency ||
    cart.items.find((i) => i.product)?.product?.default_input_currency ||
    ""
  return {
    title: cart.vendor?.name || "Cart",
    lines,
    currency: String(currency),
    total: lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
  }
}

type CheckoutSeed = ReturnType<typeof cartSeed>

export function HubCartCheckoutPage({ lineSlug }: { lineSlug: "food" | "mart" }) {
  const { userProfile } = useAuth()
  const { cart, loading } = useHubCartByLine(lineSlug),
    { t } = useTranslation("app")
  const [saved, setSaved] = useState<string | null>(cart?.id ?? null)
  const [savedSeed, setSavedSeed] = useState<CheckoutSeed | undefined>()
  const liveSeed = useMemo(
    () => (cart && cart.items?.length ? cartSeed(cart) : undefined),
    [cart],
  )
  useEffect(() => {
    const key = `marketplace:cart:${userProfile?.id}:${lineSlug}`
    const seedKey = `${key}:seed`
    if (cart) {
      localStorage.setItem(key, cart.id)
      setSaved(cart.id)
      if (liveSeed) {
        localStorage.setItem(seedKey, JSON.stringify(liveSeed))
        setSavedSeed(liveSeed)
      }
    } else if (!loading) {
      setSaved(localStorage.getItem(key))
      const raw = localStorage.getItem(seedKey)
      if (raw) {
        try {
          setSavedSeed(JSON.parse(raw) as CheckoutSeed)
        } catch {
          setSavedSeed(undefined)
        }
      }
    }
  }, [userProfile?.id, lineSlug, cart?.id, loading, liveSeed])
  const id = cart?.id || (!loading ? saved : null)
  const seed = liveSeed || savedSeed
  return id ? (
    <MarketplaceCheckout source={{ kind: "cart", cartId: id }} seed={seed} />
  ) : (
    <p className="p-6">{t(loading ? "marketplace.loading" : "marketplace.emptyCart")}</p>
  )
}
