"use client"
import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import { useHubCartByLine } from "@/lib/hub-cart-client"
import { MarketplaceCheckout } from "./marketplace-checkout"
import { useTranslation } from "react-i18next"
export function HubCartCheckoutPage({ lineSlug }: { lineSlug: "food" | "mart" }) {
  const { userProfile } = useAuth()
  const { cart, loading } = useHubCartByLine(lineSlug),
    { t } = useTranslation("app")
  const [saved, setSaved] = useState<string | null>(null)
  useEffect(() => {
    const key = `marketplace:cart:${userProfile?.id}:${lineSlug}`
    if (cart) {
      localStorage.setItem(key, cart.id)
      setSaved(cart.id)
    } else if (!loading) setSaved(localStorage.getItem(key))
  }, [userProfile?.id, lineSlug, cart?.id, loading])
  const id = cart?.id || (!loading ? saved : null)
  return id ? (
    <MarketplaceCheckout source={{ kind: "cart", cartId: id }} />
  ) : (
    <p className="p-6">{t(loading ? "marketplace.loading" : "marketplace.emptyCart")}</p>
  )
}
