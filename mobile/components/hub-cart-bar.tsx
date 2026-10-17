import { Pressable, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { ShoppingCart } from "lucide-react-native"
import { hubCartItemCount, useHubCart, useHubCartByLine } from "@/lib/hub-cart"
import { hubProductEffectivePrice } from "@/lib/money"
import { hubCartPath } from "@/lib/hub"
import { formatMoney } from "@/lib/money"
import { colors, radius, shadows, type as typeSize } from "@/lib/theme"

/**
 * Floating bar shown on Food/Mart screens once the cart has items. Pass `vendorId` on a vendor
 * storefront (single vendor in view); pass just `lineSlug` on a mixed listing (line home / mixed
 * catalog) — there's at most one active cart per line, so it's still "the" cart either way.
 */
export function HubCartBar({ lineSlug, vendorId }: { lineSlug: "food" | "mart"; vendorId?: string | null }) {
  const { t } = useTranslation("app")
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const byVendor = useHubCart(vendorId ?? null)
  const byLine = useHubCartByLine(lineSlug)
  const cart = vendorId ? byVendor.cart : byLine.cart
  const count = hubCartItemCount(cart)

  if (!cart || count <= 0) return null

  const currency = cart.items.find((i) => i.product?.fixed_currency)?.product?.fixed_currency || ""
  const subtotal = cart.items.reduce((sum, i) => {
    if (!i.product || i.unavailable) return sum
    return sum + hubProductEffectivePrice(i.product) * i.quantity
  }, 0)

  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <Pressable
        onPress={() => router.push(hubCartPath(lineSlug) as never)}
        style={styles.bar}
        accessibilityRole="button"
        accessibilityLabel={t("hub.cart.viewCart", { defaultValue: "View cart" })}
      >
        <View style={styles.left}>
          <ShoppingCart size={20} color={colors.onPrimary} strokeWidth={2.2} />
          <Text style={styles.label}>
            {t("hub.cart.viewCart", { defaultValue: "View cart" })} · {t("hub.cart.itemCount", { defaultValue: "{{count}} item", count })}
          </Text>
        </View>
        {currency ? <Text style={styles.amount}>{formatMoney(subtotal, currency)}</Text> : null}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  // Floats above the home indicator; screens under it have no tab bar.
  wrap: { position: "absolute", left: 16, right: 16, zIndex: 50 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    minHeight: 56,
    borderRadius: radius.card,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    ...shadows.cartBar,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  label: { fontSize: typeSize.label, fontWeight: "600", color: colors.onPrimary },
  amount: { fontSize: typeSize.label, fontWeight: "700", color: colors.onPrimary, fontVariant: ["tabular-nums"] },
})
