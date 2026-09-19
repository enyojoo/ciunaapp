import { useEffect } from "react"
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native"
import { Image } from "expo-image"
import { StatusBar } from "expo-status-bar"
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Minus, Plus } from "lucide-react-native"
import { EmptyState } from "@/components/empty-state"
import { HubRecommendedProducts } from "@/components/hub-recommended-products"
import { HubCartBar } from "@/components/hub-cart-bar"
import { HubCartHeaderButton } from "@/components/hub-cart-header-button"
import { PrimaryButton } from "@/components/primary-button"
import { VendorChip } from "@/components/product-card"
import { ScreenScroll } from "@/components/screen"
import { useToast } from "@/components/toast-provider"
import { addToHubCart, updateHubCartItemQuantity, useHubCart } from "@/lib/hub-cart"
import { hubMarketplaceCheckoutPath, hubMarketplaceVendorPath, hubProductDetailPath, isHubMarketplaceSlug } from "@/lib/hub"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useHubProduct } from "@/lib/use-hub-product"
import { useHubVendorProducts } from "@/lib/use-hub-vendor"
import { useRevalidateOnForeground } from "@/lib/use-revalidate-on-foreground"
import { formatCardPrice, hubProductEffectivePrice, hubProductListPrice, hubProductShowListStrike } from "@/lib/money"
import type { HubProduct } from "@/lib/types"
import { colors, radius, type as typeSize } from "@/lib/theme"

/**
 * Every product card opens here first — this screen's CTA is where the actual add-to-cart / order
 * action happens, not the catalog grid (the grid's own quick-add button is a shortcut to the same
 * logic, not a replacement for this screen).
 */
export default function HubProductDetailScreen() {
  const { slug, productId } = useLocalSearchParams<{ slug: string; productId: string }>()
  const line = String(slug || "").toLowerCase()
  const marketplace = isHubMarketplaceSlug(line)
  const navigation = useNavigation()
  const router = useRouter()
  const { t } = useTranslation("app")
  const { showInfo, showError } = useToast()
  const { data: product, loading, error, revalidate } = useHubProduct(productId)
  const notFound = !loading && (Boolean(error) || !product)

  useFocusRevalidate(revalidate)
  useRevalidateOnForeground(revalidate)

  useEffect(() => {
    // No title — the product name is already the big heading in the body; a repeated header title is redundant.
    navigation.setOptions({
      title: "",
      headerRight: marketplace ? () => <HubCartHeaderButton lineSlug={line as "food" | "mart"} variant="plain" /> : undefined,
    })
  }, [navigation, marketplace, line])

  const cartMode = Boolean(product) && product!.pricing_type === "fixed" && Boolean(product!.vendor_id)
  const { cart } = useHubCart(cartMode ? product!.vendor_id : null)
  const cartItem = cart?.items.find((i) => i.hub_product_id === product?.id) || null
  const cartQuantity = cartItem?.quantity ?? 0

  // "More from {vendor}" — recommendations are scoped to the same vendor since a cart can only
  // ever hold one vendor's items; suggesting anything else would just be a dead end for the CTA.
  const vendorProducts = useHubVendorProducts(line, marketplace ? product?.vendor?.slug : undefined)
  const moreFromVendor = vendorProducts.filter((p) => p.id !== product?.id)

  const price = product ? hubProductEffectivePrice(product) : 0
  const list = product ? hubProductListPrice(product) : null
  const strike = product ? hubProductShowListStrike(product) : false
  const currency = product?.fixed_currency || product?.default_input_currency || ""
  const soldOut = Boolean(product?.sold_out) || (product?.stock_quantity != null && Number(product.stock_quantity) <= 0)

  const handleAddToCart = () => {
    if (!product?.vendor_id) return
    void addToHubCart({
      vendorId: product.vendor_id,
      serviceLineSlug: line as "food" | "mart",
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
    if (!product?.vendor_id || !cartItem) return
    void updateHubCartItemQuantity(product.vendor_id, cartItem.id, quantity).catch((e) => {
      showError(e instanceof Error ? e.message : t("hub.cart.updateFailed", { defaultValue: "Couldn't update cart" }))
    })
  }

  if (loading) {
    return (
      <ScreenScroll edges={["left", "right"]}>
        <StatusBar style="dark" />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenScroll>
    )
  }

  if (notFound || !product) {
    return (
      <ScreenScroll edges={["left", "right"]}>
        <StatusBar style="dark" />
        <EmptyState title={t("hub.productNotFound", { defaultValue: "Product not found." })} />
      </ScreenScroll>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <ScreenScroll edges={["left", "right"]} contentStyle={marketplace ? styles.contentWithCartBar : undefined}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.noImage}>{t("hub.noImage", { defaultValue: "No image" })}</Text>
          </View>
        )}
        <Text style={styles.title}>{product.title}</Text>
        {product.vendor ? (
          marketplace && product.vendor.slug ? (
            <Pressable
              onPress={() => router.push(hubMarketplaceVendorPath(line, product.vendor!.slug) as never)}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel={product.vendor.name}
              style={styles.vendorHit}
            >
              <VendorChip vendor={product.vendor} />
            </Pressable>
          ) : (
            <View style={styles.vendorHit}>
              <VendorChip vendor={product.vendor} />
            </View>
          )
        ) : null}
        {product.short_description ? <Text style={styles.desc}>{product.short_description}</Text> : null}

        <View style={styles.priceRow}>
          {product.pricing_type === "user_input" ? (
            <Text style={styles.pricePrefix}>
              {product.funded_min
                ? t("hub.payFrom", { defaultValue: "Pay from" })
                : t("hub.setAmount", { defaultValue: "Set amount" })}
            </Text>
          ) : (
            <Text style={styles.pricePrefix}>{t("hub.sellPrice", { defaultValue: "Sell price" })}</Text>
          )}
          {strike && list != null ? <Text style={styles.strike}>{formatCardPrice(list, currency)}</Text> : null}
          <Text style={styles.price}>
            {product.pricing_type === "user_input" && product.funded_min
              ? formatCardPrice(product.funded_min, currency)
              : formatCardPrice(price, currency)}
          </Text>
        </View>

        <View style={styles.ctaBlock}>
          {product.pricing_type === "user_input" ? (
            <PrimaryButton
              label={t("hub.order", { defaultValue: "Order" })}
              onPress={() => router.push(hubMarketplaceCheckoutPath(line, product.id) as never)}
            />
          ) : cartMode ? (
            cartQuantity > 0 ? (
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => handleQuantityChange(cartQuantity - 1)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={t("hub.cart.decrease", { defaultValue: "Decrease quantity" })}
                  style={styles.stepperBtn}
                >
                  <Minus size={18} color={colors.primary} strokeWidth={2.4} />
                </Pressable>
                <Text style={styles.stepperValue}>{cartQuantity}</Text>
                <Pressable
                  onPress={() => handleQuantityChange(cartQuantity + 1)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={t("hub.cart.increase", { defaultValue: "Increase quantity" })}
                  style={styles.stepperBtn}
                >
                  <Plus size={18} color={colors.primary} strokeWidth={2.4} />
                </Pressable>
              </View>
            ) : (
              <PrimaryButton
                label={soldOut ? t("hub.soldOut", { defaultValue: "Sold out" }) : t("hub.cart.addToCart", { defaultValue: "Add to cart" })}
                onPress={() => handleAddToCart()}
                disabled={soldOut}
              />
            )
          ) : (
            <PrimaryButton
              label={t("hub.order", { defaultValue: "Order" })}
              onPress={() => router.push(hubMarketplaceCheckoutPath(line, product.id) as never)}
            />
          )}
        </View>

        <HubRecommendedProducts
          products={moreFromVendor}
          // "More from {vendor}" — recommendations are always this product's own vendor, so
          // adding one never conflicts with what's already in the cart.
          heading={t("hub.cart.moreFromVendor", {
            defaultValue: "More from {{vendor}}",
            vendor: product.vendor?.name || "",
          })}
          onProductPress={(p) => router.push(hubProductDetailPath(line, p.id) as never)}
          cartLineSlug={cartMode ? (line as "food" | "mart") : undefined}
        />
      </ScreenScroll>
      {marketplace ? <HubCartBar lineSlug={line as "food" | "mart"} vendorId={product.vendor_id} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  center: { paddingVertical: 60, alignItems: "center" },
  // A small gap so the last content (the recommendations rail) doesn't end up pressed right up
  // against the floating cart bar — not a big empty void at the end of the scroll.
  contentWithCartBar: { paddingBottom: 56 },
  image: { width: "100%", aspectRatio: 4 / 3, borderRadius: radius.card, marginBottom: 12, backgroundColor: colors.paper },
  imageFallback: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: radius.card,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noImage: { fontSize: typeSize.meta, color: colors.muted },
  title: { fontSize: 20, fontWeight: "600", color: colors.text },
  vendorHit: { marginTop: 6, alignSelf: "flex-start", maxWidth: "100%" },
  desc: { marginTop: 10, fontSize: typeSize.body, lineHeight: 22, color: colors.text },
  priceRow: { marginTop: 20, flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", gap: 6 },
  pricePrefix: { fontSize: typeSize.meta, fontWeight: "500", color: colors.muted },
  price: { fontSize: 22, fontWeight: "700", color: colors.text },
  strike: { fontSize: typeSize.meta, color: colors.muted, textDecorationLine: "line-through" },
  ctaBlock: { marginTop: 20 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 20,
  },
  stepperBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  stepperValue: { fontSize: 18, fontWeight: "700", color: colors.primary },
})
