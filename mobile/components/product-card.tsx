import { useState } from "react"
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native"
import { Image } from "expo-image"
import { BadgeCheck, Minus, Plus, ShoppingCart } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import {
  formatCardPrice,
  hubProductEffectivePrice,
  hubProductListPrice,
  hubProductShowListStrike,
} from "@/lib/money"
import type { HubProduct } from "@/lib/types"
import { colors, radius, shadow, shadowNone } from "@/lib/theme"
import { addToHubCart, updateHubCartItemQuantity, useHubCart } from "@/lib/hub-cart"
import { useToast } from "@/components/toast-provider"

export function ProductCard({
  product,
  cta,
  onPress,
  onVendorPress,
  showVendor = true,
  showCategory = false,
  cartLineSlug,
  style,
}: {
  product: HubProduct
  cta: string
  /** Tapping the card (image/title/anywhere outside the CTA) always opens the product detail screen — never a direct checkout shortcut. */
  onPress?: () => void
  onVendorPress?: () => void
  showVendor?: boolean
  showCategory?: boolean
  /**
   * Cart mode (Food/Mart, any listing — vendor storefront or the mixed catalog): when set, this
   * card owns its own cart lookup for `product.vendor_id` and the CTA becomes a quick Add-to-cart/
   * stepper shortcut. Fixed-price products only — `user_input` products' CTA also just opens the
   * detail screen (`onPress`), since the real "Order" action lives there.
   */
  cartLineSlug?: "food" | "mart"
  /** Overrides the default `48.5%` grid-cell width — e.g. a fixed pixel width in a horizontal rail. */
  style?: StyleProp<ViewStyle>
}) {
  const { t } = useTranslation("app")
  const { showInfo, showError } = useToast()
  const price = hubProductEffectivePrice(product)
  const list = hubProductListPrice(product)
  const strike = hubProductShowListStrike(product)
  const currency = product.fixed_currency || product.default_input_currency || ""
  const vendor = product.vendor
  const category = (product.category || "").trim() || "Other"
  const userInput = product.pricing_type === "user_input"
  const min = product.funded_min
  const hasMin = typeof min === "number" && Number.isFinite(min)
  const cartMode = Boolean(cartLineSlug) && !userInput && Boolean(product.vendor_id)
  const soldOut = Boolean(product.sold_out) || (product.stock_quantity != null && Number(product.stock_quantity) <= 0)

  const { cart } = useHubCart(cartMode ? product.vendor_id : null)
  const [busy, setBusy] = useState(false)
  const cartItem = cart?.items.find((i) => i.hub_product_id === product.id) || null
  const cartQuantity = cartItem?.quantity ?? 0

  const handleAddToCart = async () => {
    if (!product.vendor_id || !cartLineSlug) return
    setBusy(true)
    try {
      const { clearedVendorName } = await addToHubCart({
        vendorId: product.vendor_id,
        serviceLineSlug: cartLineSlug,
        hubProductId: product.id,
      })
      if (clearedVendorName) {
        showInfo(
          t("hub.cart.clearedOtherVendor", { defaultValue: "Your {{vendor}} cart was cleared.", vendor: clearedVendorName }),
        )
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : t("hub.cart.addFailed", { defaultValue: "Couldn't add to cart" }))
    } finally {
      setBusy(false)
    }
  }

  const handleQuantityChange = async (quantity: number) => {
    if (!product.vendor_id || !cartItem) return
    setBusy(true)
    try {
      await updateHubCartItemQuantity(product.vendor_id, cartItem.id, quantity)
    } catch (e) {
      showError(e instanceof Error ? e.message : t("hub.cart.updateFailed", { defaultValue: "Couldn't update cart" }))
    } finally {
      setBusy(false)
    }
  }

  const media = (
    <View style={styles.imageWrap}>
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.image} contentFit="contain" />
      ) : (
        <View style={styles.imageFallback}>
          <Text style={styles.noImage}>{t("hub.noImage", { defaultValue: "No image" })}</Text>
        </View>
      )}
      {showCategory ? (
        <View style={styles.catBadge}>
          <Text style={styles.catBadgeText} numberOfLines={1}>
            {category}
          </Text>
        </View>
      ) : null}
    </View>
  )

  const titleBlock = (
    <>
      <Text style={styles.title} numberOfLines={1}>
        {product.title}
      </Text>
      {showVendor && vendor?.name ? (
        onVendorPress ? (
          <Pressable onPress={onVendorPress} hitSlop={4} accessibilityRole="button" accessibilityLabel={vendor.name} style={styles.vendorHit}>
            <VendorChip vendor={vendor} />
          </Pressable>
        ) : (
          <View style={styles.vendorHit}>
            <VendorChip vendor={vendor} />
          </View>
        )
      ) : null}
    </>
  )

  return (
    <View style={[styles.hit, style]}>
      <Pressable
        style={styles.card}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={product.title}
      >
        {media}
        <View style={styles.body}>
          {titleBlock}
          <View style={styles.priceBlock}>
            {userInput ? (
              <View style={styles.priceRow}>
                <Text style={styles.pricePrefix}>
                  {hasMin
                    ? t("hub.payFrom", { defaultValue: "Pay from" })
                    : t("hub.setAmount", { defaultValue: "Set amount" })}
                </Text>
                {hasMin ? <Text style={styles.price}>{formatCardPrice(min, currency)}</Text> : null}
              </View>
            ) : (
              <View style={styles.priceRow}>
                <Text style={styles.pricePrefix}>{t("hub.sellPrice", { defaultValue: "Sell price" })}</Text>
                {strike && list != null ? <Text style={styles.strike}>{formatCardPrice(list, currency)}</Text> : null}
                <Text style={styles.price}>{formatCardPrice(price, currency)}</Text>
              </View>
            )}
            {cartMode ? (
              cartQuantity > 0 ? (
                <View style={styles.stepper}>
                  <Pressable
                    onPress={() => void handleQuantityChange(cartQuantity - 1)}
                    disabled={busy}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={t("hub.cart.decrease", { defaultValue: "Decrease quantity" })}
                    style={styles.stepperBtn}
                  >
                    <Minus size={14} color={colors.primary} strokeWidth={2.4} />
                  </Pressable>
                  {busy ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={styles.stepperValue}>{cartQuantity}</Text>
                  )}
                  <Pressable
                    onPress={() => void handleQuantityChange(cartQuantity + 1)}
                    disabled={busy}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={t("hub.cart.increase", { defaultValue: "Increase quantity" })}
                    style={styles.stepperBtn}
                  >
                    <Plus size={14} color={colors.primary} strokeWidth={2.4} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => void handleAddToCart()}
                  disabled={busy || soldOut}
                  accessibilityRole="button"
                  accessibilityLabel={t("hub.cart.addToCart", { defaultValue: "Add to cart" })}
                  style={[styles.cta, (busy || soldOut) && styles.ctaDisabled]}
                >
                  {busy ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : soldOut ? (
                    <Text style={styles.ctaText}>{t("hub.soldOut", { defaultValue: "Sold out" })}</Text>
                  ) : (
                    <View style={styles.ctaWithIcon}>
                      <ShoppingCart size={13} color="#FFFFFF" strokeWidth={2.4} />
                      <Text style={styles.ctaText}>{t("hub.cart.addToCart", { defaultValue: "Add to cart" })}</Text>
                    </View>
                  )}
                </Pressable>
              )
            ) : (
              <View style={styles.cta}>
                <Text style={styles.ctaText}>{cta}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </View>
  )
}

/** Exported so the product detail screen can show the same vendor treatment (photo, name, verified check) as the catalog card, instead of a plain name. */
export function VendorChip({ vendor }: { vendor: NonNullable<HubProduct["vendor"]> }) {
  return (
    <View style={styles.vendorRow}>
      {vendor.photo_url ? (
        <Image source={{ uri: vendor.photo_url }} style={styles.vendorPhoto} contentFit="cover" />
      ) : (
        <View style={styles.vendorFallback}>
          <Text style={styles.vendorInitial}>{(vendor.name.trim().charAt(0) || "?").toUpperCase()}</Text>
        </View>
      )}
      <Text style={styles.vendorName} numberOfLines={1}>
        {vendor.name}
      </Text>
      {vendor.is_verified ? <BadgeCheck size={12} color={colors.primary} strokeWidth={2.2} /> : null}
    </View>
  )
}

export function ProductCardSkeleton() {
  return (
    <View style={styles.hit}>
      <View style={[styles.card, styles.skeleton]}>
        <View style={styles.imageFallback} />
        <View style={styles.body}>
          <View style={styles.skelTitle} />
          <View style={styles.skelMeta} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  hit: { width: "48.5%" },
  card: {
    overflow: "hidden",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: colors.surface,
    ...shadow({ opacity: 0.08, radius: 10, offsetY: 4, elevation: 2 }),
  },
  skeleton: { borderColor: colors.border, ...shadowNone },
  imageWrap: { width: "100%", aspectRatio: 4 / 3, backgroundColor: "#F3F4F6" },
  image: { width: "100%", height: "100%" },
  imageFallback: {
    width: "100%",
    aspectRatio: 4 / 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  noImage: { fontSize: 11, color: colors.muted, textAlign: "center", paddingHorizontal: 8 },
  catBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    maxWidth: "72%",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  catBadgeText: { fontSize: 9, fontWeight: "600", color: "#374151" },
  body: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10 },
  title: { fontSize: 13, fontWeight: "600", lineHeight: 17, color: colors.text },
  vendorHit: { marginTop: 6, alignSelf: "flex-start", maxWidth: "100%" },
  vendorRow: { flexDirection: "row", alignItems: "center", gap: 6, maxWidth: "100%" },
  vendorPhoto: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.paper },
  vendorFallback: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  vendorInitial: { fontSize: 9, fontWeight: "700", color: colors.muted },
  vendorName: { flexShrink: 1, fontSize: 11, fontWeight: "500", color: colors.text },
  priceBlock: { marginTop: 10, gap: 8 },
  priceRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", gap: 4 },
  pricePrefix: { fontSize: 11, fontWeight: "500", color: colors.muted },
  price: { fontSize: 15, fontWeight: "700", color: colors.text },
  strike: { fontSize: 11, color: colors.muted, textDecorationLine: "line-through" },
  cta: {
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { fontSize: 12, fontWeight: "600", color: "#FFFFFF" },
  ctaWithIcon: { flexDirection: "row", alignItems: "center", gap: 5 },
  stepper: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 6,
  },
  stepperBtn: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  stepperValue: { flex: 1, textAlign: "center", fontSize: 13, fontWeight: "700", color: colors.primary },
  skelTitle: { height: 14, width: "80%", borderRadius: 4, backgroundColor: colors.paper },
  skelMeta: { marginTop: 8, height: 10, width: "50%", borderRadius: 4, backgroundColor: colors.paper },
})
