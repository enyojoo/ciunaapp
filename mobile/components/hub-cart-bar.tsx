import { Pressable, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { ShoppingCart } from "lucide-react-native"
import { hubCartItemCount, useHubCart, useHubCartByLine } from "@/lib/hub-cart"
import { hubProductEffectivePrice } from "@/lib/money"
import { hubCartPath } from "@/lib/hub"
import { formatMoney } from "@/lib/money"
import { colors, radius } from "@/lib/theme"

/**
 * Floating bar shown on Food/Mart screens once the cart has items. Pass `vendorId` on a vendor
 * storefront (single vendor in view); pass just `lineSlug` on a mixed listing (line home / mixed
 * catalog) — there's at most one active cart per line, so it's still "the" cart either way.
 */
export function HubCartBar({ lineSlug, vendorId }: { lineSlug: "food" | "mart"; vendorId?: string | null }) {
  const { t } = useTranslation("app")
  const router = useRouter()
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
    <View style={styles.wrap} pointerEvents="box-none">
      <Pressable
        onPress={() => router.push(hubCartPath(lineSlug) as never)}
        style={styles.bar}
        accessibilityRole="button"
        accessibilityLabel={t("hub.cart.viewCart", { defaultValue: "View cart" })}
      >
        <View style={styles.left}>
          <ShoppingCart size={16} color="#FFFFFF" strokeWidth={2.2} />
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
  wrap: { position: "absolute", left: 12, right: 12, bottom: 6, zIndex: 50 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: radius.pill,
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  label: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },
  amount: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
})
