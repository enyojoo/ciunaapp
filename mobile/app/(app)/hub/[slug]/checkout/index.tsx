import { useAuth } from "@/lib/auth-context"
import { useEffect, useMemo, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"
import { useHubCartByLine } from "@/lib/hub-cart"
import { MarketplaceCheckout } from "@/components/marketplace-checkout"
import { hubProductEffectivePrice } from "@/lib/money"
import type { HubCart } from "@/lib/types"
import { colors, type as typeSize } from "@/lib/theme"

type CheckoutSeed = {
  title: string
  lines: { id: string; quantity: number; title: string; unitPrice: number }[]
  currency: string
  total?: number
}

function cartSeed(cart: HubCart): CheckoutSeed {
  const lines = cart.items
    .filter((i) => !i.unavailable && i.product)
    .map((i) => ({
      id: i.id,
      quantity: i.quantity,
      title: i.product!.title,
      unitPrice: hubProductEffectivePrice(i.product!),
    }))
  const currency =
    cart.items.find((i) => i.product)?.product?.fixed_currency ||
    cart.items.find((i) => i.product)?.product?.default_input_currency ||
    ""
  return {
    title: cart.vendor?.name || "Cart",
    lines,
    currency,
    total: lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
  }
}

export default function HubCartCheckout() {
  const { profile } = useAuth()
  const { slug } = useLocalSearchParams<{ slug: string }>(),
    { cart, loading } = useHubCartByLine(slug as "food" | "mart"),
    { t } = useTranslation("app")
  const [saved, setSaved] = useState<string | null>(cart?.id ?? null)
  const [savedSeed, setSavedSeed] = useState<CheckoutSeed | undefined>()
  const liveSeed = useMemo(
    () => (cart && cart.items.length ? cartSeed(cart) : undefined),
    [cart],
  )
  useEffect(() => {
    let active = true
    const key = `marketplace:cart:${profile?.id}:${slug}`
    const seedKey = `${key}:seed`
    if (cart) {
      void AsyncStorage.setItem(key, cart.id)
      setSaved(cart.id)
      if (liveSeed) {
        void AsyncStorage.setItem(seedKey, JSON.stringify(liveSeed))
        setSavedSeed(liveSeed)
      }
    } else if (!loading)
      void Promise.all([AsyncStorage.getItem(key), AsyncStorage.getItem(seedKey)]).then(
        ([id, seedRaw]) => {
          if (!active) return
          setSaved(id)
          if (seedRaw) {
            try {
              setSavedSeed(JSON.parse(seedRaw) as CheckoutSeed)
            } catch {
              setSavedSeed(undefined)
            }
          }
        },
      )
    return () => {
      active = false
    }
  }, [profile?.id, slug, cart?.id, loading, liveSeed])
  const id = cart?.id || saved
  const seed = liveSeed || savedSeed
  if (id) return <MarketplaceCheckout source={{ kind: "cart", cartId: id }} seed={seed} />
  if (loading || saved === null) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }
  return (
    <View style={styles.boot}>
      <Text style={styles.empty}>{t("marketplace.emptyCart")}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: colors.paper },
  empty: { fontSize: typeSize.body, color: colors.muted, textAlign: "center" },
})
