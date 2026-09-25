import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Text } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"
import { useHubCartByLine } from "@/lib/hub-cart"
import { MarketplaceCheckout } from "@/components/marketplace-checkout"
export default function HubCartCheckout() {
  const { profile } = useAuth()
  const { slug } = useLocalSearchParams<{ slug: string }>(),
    { cart, loading } = useHubCartByLine(slug as "food" | "mart"),
    { t } = useTranslation("app")
  const [saved, setSaved] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    const key = `marketplace:cart:${profile?.id}:${slug}`
    if (cart) {
      void AsyncStorage.setItem(key, cart.id)
      setSaved(cart.id)
    } else if (!loading)
      void AsyncStorage.getItem(key).then((id) => {
        if (active) setSaved(id)
      })
    return () => {
      active = false
    }
  }, [profile?.id, slug, cart?.id, loading])
  const id = cart?.id || (!loading ? saved : null)
  return id ? (
    <MarketplaceCheckout source={{ kind: "cart", cartId: id }} />
  ) : (
    <Text>{t(loading ? "marketplace.loading" : "marketplace.emptyCart")}</Text>
  )
}
