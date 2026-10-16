import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native"
import { Image } from "expo-image"
import { BadgeCheck, Minus, Plus, Store } from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useTranslation } from "react-i18next"
import {
  formatCardPrice,
  hubProductEffectivePrice,
  hubProductListPrice,
  hubProductShowListStrike,
} from "@/lib/money"
import type { HubProduct } from "@/lib/types"
import { catalogCardWidth, useCatalogGridColumns } from "@/lib/responsive-layout"
import { colors, radius, shadow, shadowNone } from "@/lib/theme"
import { addToHubCart, updateHubCartItemQuantity, useHubCart } from "@/lib/hub-cart"
import { useToast } from "@/components/toast-provider"
import { FavouriteHeart } from "@/components/favourite-heart"
import { tileArtFor } from "@/components/tile"

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
  const columns = useCatalogGridColumns()
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
  const cartItem = cart?.items.find((i) => i.hub_product_id === product.id) || null
  const cartQuantity = cartItem?.quantity ?? 0

  const handleAddToCart = () => {
    if (!product.vendor_id || !cartLineSlug) return
    void addToHubCart({
      vendorId: product.vendor_id,
      serviceLineSlug: cartLineSlug,
      hubProductId: product.id,
      product,
    })
      .then(({ clearedVendorName }) => {
        if (clearedVendorName) {
          showInfo(
            t("hub.cart.clearedOtherVendor", { defaultValue: "Your {{vendor}} cart was cleared.", vendor: clearedVendorName }),
          )
        }
      })
      .catch((e) => {
        showError(e instanceof Error ? e.message : t("hub.cart.addFailed", { defaultValue: "Couldn't add to cart" }))
      })
  }

  const handleQuantityChange = (quantity: number) => {
    if (!product.vendor_id || !cartItem) return
    void updateHubCartItemQuantity(product.vendor_id, cartItem.id, quantity).catch((e) => {
      showError(e instanceof Error ? e.message : t("hub.cart.updateFailed", { defaultValue: "Couldn't update cart" }))
    })
  }

  const art = tileArtFor(product.service_line_slug || cartLineSlug || "food")
  const ArtIcon = art.icon

  /** Design: 4:3 media, heart top right, low-stock line, price with struck list price, round add button. */
  const media = (
    <View style={styles.imageWrap}>
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.image} contentFit="cover" />
      ) : (
        <>
          <LinearGradient colors={[art.from, art.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <ArtIcon size={34} color="rgba(255,255,255,0.9)" strokeWidth={2} />
        </>
      )}
      {soldOut ? (
        <View style={styles.soldPill}>
          <Text style={styles.soldText}>{t("hub.soldOut", { defaultValue: "Sold out" })}</Text>
        </View>
      ) : null}
      {showCategory ? (
        <View style={styles.catBadge}>
          <Text style={styles.catBadgeText} numberOfLines={1}>
            {category}
          </Text>
        </View>
      ) : null}
    </View>
  )

  const lowStock =
    !soldOut && product.stock_quantity != null && Number(product.stock_quantity) > 0 && Number(product.stock_quantity) <= 5

  const vendorLine =
    showVendor && vendor?.name ? (
      <View style={styles.vendorRow}>
        <Store size={12} color={colors.muted} strokeWidth={2.2} />
        <Text style={styles.vendorName} numberOfLines={1}>
          {vendor.name}
        </Text>
        {vendor.is_verified ? <BadgeCheck size={12} color={colors.success} strokeWidth={2.4} /> : null}
      </View>
    ) : null

  const priceRow = userInput ? (
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
      <Text style={styles.price}>{formatCardPrice(price, currency)}</Text>
      {strike && list != null ? <Text style={styles.strike}>{formatCardPrice(list, currency)}</Text> : null}
    </View>
  )

  const cartOrCta = cartMode && cartQuantity > 0 ? (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => handleQuantityChange(cartQuantity - 1)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={t("hub.cart.decrease", { defaultValue: "Decrease quantity" })}
        style={styles.stepperBtn}
      >
        <Minus size={16} color={colors.text} strokeWidth={2.4} />
      </Pressable>
      <Text style={styles.stepperValue}>{cartQuantity}</Text>
      <Pressable
        onPress={() => handleQuantityChange(cartQuantity + 1)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={t("hub.cart.increase", { defaultValue: "Increase quantity" })}
        style={styles.stepperBtn}
      >
        <Plus size={16} color={colors.text} strokeWidth={2.4} />
      </Pressable>
    </View>
  ) : cartMode ? (
    <Pressable
      onPress={() => handleAddToCart()}
      disabled={soldOut}
      accessibilityRole="button"
      accessibilityLabel={t("hub.cart.addToCart", { defaultValue: "Add to cart" })}
      style={({ pressed }) => [styles.add, soldOut && styles.addDisabled, pressed && styles.addPressed]}
    >
      <Plus size={20} color={soldOut ? colors.subtle : "#FFFFFF"} strokeWidth={2.4} />
    </Pressable>
  ) : (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={cta}
      style={({ pressed }) => [styles.add, pressed && styles.addPressed]}
    >
      <Plus size={20} color="#FFFFFF" strokeWidth={2.4} />
    </Pressable>
  )

  return (
    <View style={[styles.hit, { width: catalogCardWidth(columns) }, style]}>
      {/* View shell — nested Pressables become nested <button>s on web and throw. */}
      <View style={styles.card}>
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={product.title}>
          {media}
          <View style={styles.bodyTop}>
            <Text style={styles.title} numberOfLines={2}>
              {product.title}
            </Text>
            {vendorLine}
            {lowStock ? (
              <Text style={styles.low}>{t("hub.onlyLeft", { defaultValue: "Only {{count}} left", count: Number(product.stock_quantity) })}</Text>
            ) : null}
          </View>
        </Pressable>
        <View style={styles.body}>
          <View style={styles.row}>
            <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={product.title} style={styles.priceHit}>
              {priceRow}
            </Pressable>
            {cartOrCta}
          </View>
        </View>
        <FavouriteHeart type="product" id={product.id} style={styles.heart} />
      </View>
    </View>
  )
}

/** Exported so the product detail screen can show the same vendor treatment (photo, name, verified check) as the catalog card, instead of a plain name. */
export function VendorChip({ vendor }: { vendor: NonNullable<HubProduct["vendor"]> }) {
  return (
    <View style={vendorStyles.vendorRow}>
      {vendor.photo_url ? (
        <Image source={{ uri: vendor.photo_url }} style={vendorStyles.vendorPhoto} contentFit="cover" />
      ) : (
        <View style={vendorStyles.vendorFallback}>
          <Text style={vendorStyles.vendorInitial}>{(vendor.name.trim().charAt(0) || "?").toUpperCase()}</Text>
        </View>
      )}
      <Text style={vendorStyles.vendorName} numberOfLines={1}>
        {vendor.name}
      </Text>
      {vendor.is_verified ? <BadgeCheck size={12} color={colors.primary} strokeWidth={2.2} /> : null}
    </View>
  )
}

export function ProductCardSkeleton() {
  const columns = useCatalogGridColumns()
  return (
    <View style={[styles.hit, { width: catalogCardWidth(columns) }]}>
      <View style={[styles.card, styles.skeleton]}>
        <View style={styles.imageWrap} />
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
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 4 / 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paper,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  soldPill: {
    position: "absolute",
    left: 8,
    bottom: 8,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  soldText: { fontSize: 12, fontWeight: "600", color: colors.text },
  catBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    maxWidth: "60%",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  catBadgeText: { fontSize: 11, fontWeight: "600", color: colors.neutralText },
  heart: { top: 8, right: 8 },
  bodyTop: { paddingHorizontal: 12, paddingTop: 10, gap: 4 },
  body: { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 12 },
  title: { fontSize: 14, fontWeight: "600", lineHeight: 19, color: colors.text },
  vendorRow: { flexDirection: "row", alignItems: "center", gap: 4, maxWidth: "100%" },
  vendorName: { flexShrink: 1, fontSize: 12, lineHeight: 16, fontWeight: "500", color: colors.muted },
  low: { fontSize: 12, lineHeight: 16, fontWeight: "600", color: colors.warningText },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, minHeight: 40 },
  priceHit: { flexShrink: 1 },
  priceRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", gap: 6 },
  pricePrefix: { fontSize: 12, fontWeight: "500", color: colors.muted },
  price: { fontSize: 15, fontWeight: "700", color: colors.text },
  strike: { fontSize: 12, color: colors.muted, textDecorationLine: "line-through" },
  add: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    flexShrink: 0,
  },
  addDisabled: { backgroundColor: colors.neutralSurface },
  addPressed: { backgroundColor: colors.primaryHover },
  stepper: {
    height: 40,
    minWidth: 104,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.inputEdge,
    backgroundColor: colors.surface,
    paddingHorizontal: 4,
  },
  stepperBtn: { width: 32, height: 36, alignItems: "center", justifyContent: "center" },
  stepperValue: { minWidth: 24, textAlign: "center", fontSize: 15, fontWeight: "700", color: colors.text },
  skeleton: { borderColor: colors.border, ...shadowNone },
  skelTitle: { height: 14, width: "80%", borderRadius: 4, backgroundColor: colors.paper },
  skelMeta: { marginTop: 8, height: 10, width: "50%", borderRadius: 4, backgroundColor: colors.paper },
})

const vendorStyles = StyleSheet.create({
  vendorRow: { flexDirection: "row", alignItems: "center", gap: 6, maxWidth: "100%" },
  vendorPhoto: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.paper },
  vendorFallback: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center" },
  vendorInitial: { fontSize: 9, fontWeight: "700", color: colors.muted },
  vendorName: { flexShrink: 1, fontSize: 11, fontWeight: "500", color: colors.text },
})
