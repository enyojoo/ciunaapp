import { useEffect, useMemo } from "react"
import { NARROW_COLUMN } from "@/lib/layout-metrics"
import { shortDay } from "@/lib/store-hours"
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native"
import { StatusBar } from "expo-status-bar"
import * as Crypto from "expo-crypto"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react-native"
import {
  prefetchCheckoutQuote,
  warmCartCheckout,
} from "@ciuna/shared/marketplace/checkout-warm"
import { EmptyState } from "@/components/empty-state"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { useToast } from "@/components/toast-provider"
import { prefetchYooKassaWidgetScript } from "@/components/yookassa-checkout-widget"
import { fetchWithAuth } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { hubCartCheckoutPath, hubLineHomePath } from "@/lib/hub"
import { removeHubCartItem, updateHubCartItemQuantity, useHubCartByLine } from "@/lib/hub-cart"
import { hubProductEffectivePrice, formatMoney } from "@/lib/money"
import { HubTopBar } from "@/components/hub-top-bar"
import { colors, radius, type as typeSize } from "@/lib/theme"

function HubCartScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const line = String(slug || "").toLowerCase() as "food" | "mart"
  const router = useRouter()
  const { t, i18n } = useTranslation("app")
  const { showError } = useToast()
  const { profile } = useAuth()
  const { cart, loading } = useHubCartByLine(line)

  const fingerprint = useMemo(() => {
    if (!cart) return ""
    return cart.items
      .map((i) => `${i.hub_product_id}:${i.quantity}`)
      .sort()
      .join("|")
  }, [cart])

  const items = cart?.items || []
  const availableItems = items.filter((i) => !i.unavailable && i.product)
  const storeClosed = Boolean(cart?.vendor?.hours_configured) && cart?.vendor?.is_open === false
  const opensAt = cart?.vendor?.opens_at ?? null
  const storePaused = cart?.vendor?.is_paused === true
  const minAmount = cart?.vendor?.min_order_amount ?? null
  const minCurrency = cart?.vendor?.min_order_currency ?? null
  const unavailableItems = items.filter((i) => i.unavailable || !i.product)
  const currency = availableItems[0]?.product?.fixed_currency || ""
  const subtotal = availableItems.reduce((sum, i) => sum + hubProductEffectivePrice(i.product!) * i.quantity, 0)

  // Informational only: pickup has no minimum, so checkout stays available; delivery is checked at checkout.
  const belowMin = minAmount != null && minCurrency === currency && subtotal < minAmount
  const shortBy = belowMin && minAmount != null ? minAmount - subtotal : 0

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

  const goCheckout = () => {
    if (!cart?.id || availableItems.length === 0 || unavailableItems.length > 0 || storeClosed) return
    const contactName =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      profile?.email?.split("@")[0] ||
      ""
    void warmCartCheckout({
      cartId: cart.id,
      fingerprint,
      fetcher: fetchWithAuth,
      uuid: Crypto.randomUUID,
      gatewayMode: Platform.OS === "web" ? "embedded" : "native",
      contactName,
      contactPhone: profile?.phone || "",
    })
    router.push(hubCartCheckoutPath(line) as never)
  }

  if (loading && !cart) {
    return (
      <ScreenScroll edges={["left", "right"]} contentStyle={NARROW_COLUMN}>
      <StatusBar style="dark" />
        <View style={styles.list}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.row, styles.skeletonRow]} />
          ))}
        </View>
      </ScreenScroll>
    )
  }

  if (!cart || items.length === 0) {
    return (
      <ScreenScroll edges={["left", "right"]} contentStyle={NARROW_COLUMN}>
      <StatusBar style="dark" />
        <EmptyState
          icon={<ShoppingCart size={26} color={colors.primaryText} strokeWidth={2} />}
          title={t("hub.cart.empty", { defaultValue: "Your cart is empty." })}
          body={t("hub.cart.emptyBody", { defaultValue: "Add something from a store to start your order." })}
          actionLabel={t("hub.cart.browse", { defaultValue: "Browse Food" })}
          onAction={() => router.replace(hubLineHomePath(line) as never)}
        />
      </ScreenScroll>
    )
  }

  return (
    <ScreenScroll edges={["left", "right"]} contentStyle={NARROW_COLUMN}>
      <StatusBar style="dark" />
      {/* Store plate: who the cart is from, and a way back to add more. */}
      <View style={styles.storePlate}>
        <View style={styles.storeLogo}>
          {cart.vendor?.photo_url ? (
            <Image source={{ uri: cart.vendor.photo_url }} style={styles.storeLogoImg} resizeMode="cover" />
          ) : (
            <Text style={styles.storeLogoInitial}>{(cart.vendor?.name || "?").trim().charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <Text style={styles.storeName} numberOfLines={1}>
          {cart.vendor?.name || ""}
        </Text>
        <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.addMore}>{t("hub.cart.addMore", { defaultValue: "Add more" })}</Text>
        </Pressable>
      </View>
      <View style={styles.list}>
        {unavailableItems.map((item) => (
          <View key={item.id} style={[styles.row, styles.rowOff]}>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitleOff} numberOfLines={2}>
                {item.product?.title || ""}
              </Text>
              <Text style={styles.rowPrice}>{t("hub.cart.unavailable", { defaultValue: "No longer available" })}</Text>
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
        ))}
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
                <Text style={styles.lineTotal}>{formatMoney(unitPrice * item.quantity, product.fixed_currency)}</Text>
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

      {/* Summary plate: subtotal and total. Delivery is added at checkout, once the address is known. */}
      <View style={styles.summary}>
        <View style={styles.subtotalRow}>
          <Text style={styles.subtotalLabel}>{t("hub.cart.subtotal", { defaultValue: "Subtotal" })}</Text>
          <Text style={styles.subtotalValue}>{formatMoney(subtotal, currency)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t("hub.cart.total", { defaultValue: "Total" })}</Text>
          <Text style={styles.totalValue}>{formatMoney(subtotal, currency)}</Text>
        </View>
        <Text style={styles.deliveryNote}>
          {t("hub.cart.deliveryAtCheckout", { defaultValue: "Delivery is added at checkout." })}
        </Text>
      </View>

      {belowMin ? (
        <Text style={styles.minNote}>
          {t("hub.cart.minOrderMore", {
            more: formatMoney(shortBy, currency),
            min: formatMoney(minAmount as number, currency),
            defaultValue: "Add {{more}} more for delivery. Minimum order is {{min}}.",
          })}
        </Text>
      ) : null}
      {storeClosed ? (
        <Text style={styles.blockedNote}>
          {storePaused ? t("hub.cart.storePausedNote", { defaultValue: "This store is taking a break, so checkout is unavailable for now." }) : t("hub.cart.storeClosedNote", { defaultValue: "This store is closed, so checkout is unavailable until it opens." })}
          {opensAt ? " " + t("marketplace.storeOpensAt", { day: shortDay(opensAt.day, i18n.language), time: opensAt.time, defaultValue: "It opens {{day}} {{time}}." }) : ""}
        </Text>
      ) : null}
      {unavailableItems.length > 0 ? (
        <Text style={styles.blockedNote}>{t("hub.cart.unavailableNote", { defaultValue: "Remove unavailable items to check out." })}</Text>
      ) : null}
      <View style={styles.checkoutBtn}>
        <PrimaryButton
          label={t("hub.cart.checkoutWithTotal", {
            defaultValue: "Checkout · {{total}}",
            total: formatMoney(subtotal, currency),
          })}
          onPress={goCheckout}
          disabled={availableItems.length === 0 || unavailableItems.length > 0 || storeClosed}
        />
      </View>
    </ScreenScroll>
  )
}

/** Same top bar as Food, store and product: back chip and the screen title. */
export default function HubCartScreenScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { t } = useTranslation("app")
  return (
    <View style={{ flex: 1 }}>
      <HubTopBar title={t("hub.cart.title", { defaultValue: "Cart" })} backHref={hubLineHomePath(String(slug || "food").toLowerCase())} />
      <HubCartScreen />
    </View>
  )
}


const styles = StyleSheet.create({
  storePlate: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 12 },
  storeLogo: { width: 40, height: 40, borderRadius: 20, overflow: "hidden", backgroundColor: colors.paper, alignItems: "center", justifyContent: "center" },
  storeLogoImg: { width: "100%", height: "100%" },
  storeLogoInitial: { fontSize: 16, fontWeight: "700", color: colors.primaryText },
  storeName: { flex: 1, minWidth: 0, fontSize: 15, fontWeight: "700", color: colors.text },
  addMore: { fontSize: 14, fontWeight: "600", color: colors.primaryText },
  skeletonRow: { height: 84, backgroundColor: colors.paper, borderColor: colors.paper },
  rowOff: { opacity: 0.7 },
  rowTitleOff: { fontSize: 15, fontWeight: "600", color: colors.muted, textDecorationLine: "line-through" },
  minNote: { marginTop: 12, fontSize: 13, color: colors.primaryDeep, textAlign: "center" },
  blockedNote: { marginTop: 12, fontSize: 13, color: colors.warningText, textAlign: "center" },
  lineTotal: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 6 },
  summary: { marginTop: 16, backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: colors.text },
  totalValue: { fontSize: 18, fontWeight: "700", color: colors.text },
  deliveryNote: { fontSize: 12, color: colors.muted },
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
  stepperBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  stepperValue: { width: 22, textAlign: "center", fontSize: 13, fontWeight: "600", color: colors.text },
  removeBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
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
