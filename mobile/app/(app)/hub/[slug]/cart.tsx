import { useEffect } from "react"
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native"
import { StatusBar } from "expo-status-bar"
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Minus, Plus, Trash2 } from "lucide-react-native"
import { EmptyState } from "@/components/empty-state"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { useToast } from "@/components/toast-provider"
import { hubCartCheckoutPath, hubLineHomePath } from "@/lib/hub"
import { removeHubCartItem, updateHubCartItemQuantity, useHubCartByLine } from "@/lib/hub-cart"
import { hubProductEffectivePrice, formatMoney } from "@/lib/money"
import { colors, radius, type as typeSize } from "@/lib/theme"

export default function HubCartScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const line = String(slug || "").toLowerCase() as "food" | "mart"
  const navigation = useNavigation()
  const router = useRouter()
  const { t } = useTranslation("app")
  const { showError } = useToast()
  const { cart, loading } = useHubCartByLine(line)

  useEffect(() => {
    navigation.setOptions({ title: t("hub.cart.title", { defaultValue: "Cart" }) })
  }, [navigation, t])

  const items = cart?.items || []
  const availableItems = items.filter((i) => !i.unavailable && i.product)
  const currency = availableItems[0]?.product?.fixed_currency || ""
  const subtotal = availableItems.reduce((sum, i) => sum + hubProductEffectivePrice(i.product!) * i.quantity, 0)

  const onQuantityChange = (itemId: string, quantity: number) => {
    if (!cart) return
    void updateHubCartItemQuantity(cart.vendor_id, itemId, quantity).catch((e) => {
      showError(e instanceof Error ? e.message : t("errors.generic", { defaultValue: "Something went wrong." }))
    })
  }

  const onRemove = (itemId: string) => {
    if (!cart) return
    void removeHubCartItem(cart.vendor_id, itemId).catch((e) => {
      showError(e instanceof Error ? e.message : t("errors.generic", { defaultValue: "Something went wrong." }))
    })
  }

  if (loading && !cart) {
    return (
      <ScreenScroll edges={["left", "right"]}>
      <StatusBar style="dark" />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenScroll>
    )
  }

  if (!cart || items.length === 0) {
    return (
      <ScreenScroll edges={["left", "right"]}>
      <StatusBar style="dark" />
        <EmptyState
          title={t("hub.cart.empty", { defaultValue: "Your cart is empty." })}
          actionLabel={t("hub.cart.browse", { defaultValue: "Start browsing" })}
          onAction={() => router.replace(hubLineHomePath(line) as never)}
        />
      </ScreenScroll>
    )
  }

  return (
    <ScreenScroll edges={["left", "right"]}>
      <StatusBar style="dark" />
      <Text style={styles.vendorName}>{cart.vendor?.name || ""}</Text>
      <View style={styles.list}>
        {availableItems.map((item) => {
          const product = item.product!
          const unitPrice = hubProductEffectivePrice(product)
          return (
            <View key={item.id} style={styles.row}>
              <View style={styles.thumbWrap}>
                {product.image_url ? (
                  <Image source={{ uri: product.image_url }} style={styles.thumb} resizeMode="contain" />
                ) : null}
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {product.title}
                </Text>
                <Text style={styles.rowPrice}>{formatMoney(unitPrice, product.fixed_currency)}</Text>
              </View>
              <View style={styles.rowActions}>
                <View style={styles.stepper}>
                  <Pressable
                    onPress={() => onQuantityChange(item.id, item.quantity - 1)}
                    hitSlop={8}
                    style={styles.stepperBtn}
                    accessibilityRole="button"
                    accessibilityLabel={t("hub.cart.decrease", { defaultValue: "Decrease quantity" })}
                  >
                    <Minus size={14} color={colors.text} strokeWidth={2.2} />
                  </Pressable>
                  <Text style={styles.stepperValue}>{item.quantity}</Text>
                  <Pressable
                    onPress={() => onQuantityChange(item.id, item.quantity + 1)}
                    hitSlop={8}
                    style={styles.stepperBtn}
                    accessibilityRole="button"
                    accessibilityLabel={t("hub.cart.increase", { defaultValue: "Increase quantity" })}
                  >
                    <Plus size={14} color={colors.text} strokeWidth={2.2} />
                  </Pressable>
                </View>
                <Pressable
                  onPress={() => onRemove(item.id)}
                  hitSlop={8}
                  style={styles.removeBtn}
                  accessibilityRole="button"
                  accessibilityLabel={t("hub.cart.remove", { defaultValue: "Remove item" })}
                >
                  <Trash2 size={16} color={colors.danger} strokeWidth={2} />
                </Pressable>
              </View>
            </View>
          )
        })}
      </View>

      <View style={styles.subtotalRow}>
        <Text style={styles.subtotalLabel}>{t("hub.cart.subtotal", { defaultValue: "Subtotal" })}</Text>
        <Text style={styles.subtotalValue}>{formatMoney(subtotal, currency)}</Text>
      </View>

      <View style={styles.checkoutBtn}>
        <PrimaryButton
          label={t("hub.cart.checkout", { defaultValue: "Checkout" })}
          onPress={() => router.push(hubCartCheckoutPath(line) as never)}
          disabled={availableItems.length === 0}
        />
      </View>
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  center: { paddingVertical: 60, alignItems: "center" },
  vendorName: { fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 8 },
  list: { gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  thumbWrap: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: colors.paper,
    overflow: "hidden",
  },
  thumb: { width: "100%", height: "100%" },
  rowBody: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  rowPrice: { fontSize: typeSize.meta, color: colors.muted },
  rowActions: { alignItems: "flex-end", gap: 8 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  stepperValue: { width: 22, textAlign: "center", fontSize: 13, fontWeight: "600", color: colors.text },
  removeBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  subtotalRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  subtotalLabel: { fontSize: typeSize.body, fontWeight: "500", color: colors.text },
  subtotalValue: { fontSize: 18, fontWeight: "700", color: colors.text },
  checkoutBtn: { marginTop: 16 },
})
