import { Pressable, StyleSheet, Text, View } from "react-native"
import { StatusBar } from "expo-status-bar"
import { useLocalSearchParams, useRouter } from "expo-router"
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
import { updateHubCartItemQuantity, useHubCart } from "@/lib/hub-cart"
import { useGuardedAdd } from "@/lib/use-guarded-add"
import { HubTopBar } from "@/components/hub-top-bar"
import { ProductGallery, productImages } from "@/components/product-gallery"
import { PriceTag } from "@/components/price-tag"
import { FavouriteHeart } from "@/components/favourite-heart"
import {
  hubLineHomePath,
  hubMarketplaceCheckoutPath,
  hubMarketplaceVendorPath,
  hubProductDetailPath,
  isHubMarketplaceSlug,
} from "@/lib/hub"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useHubProduct } from "@/lib/use-hub-product"
import { useHubVendorProducts } from "@/lib/use-hub-vendor"
import { useRevalidateOnForeground } from "@/lib/use-revalidate-on-foreground"
import {
  hubProductEffectivePrice,
  hubProductListPrice,
  hubProductShowListStrike,
} from "@/lib/money"
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
  const router = useRouter()
  const { t } = useTranslation("app")
  const { showError } = useToast()
  const { data: product, loading, error, revalidate } = useHubProduct(productId)
  const notFound = !loading && (Boolean(error) || !product)

  useFocusRevalidate(revalidate)
  useRevalidateOnForeground(revalidate)

  // Same top bar as Food and Mart: back chip on the left, favourite and cart on the right.
  const topBar = (
    <HubTopBar
      backHref={hubLineHomePath(line)}
      trailing={
        <>
          {productId ? <FavouriteHeart type="product" id={String(productId)} style={styles.barHeart} /> : null}
          {marketplace ? <HubCartHeaderButton lineSlug={line as "food" | "mart"} variant="plain" /> : null}
        </>
      }
    />
  )

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
  const soldOut =
    Boolean(product?.sold_out) || (product?.stock_quantity != null && Number(product.stock_quantity) <= 0)

  const stockQty = product?.stock_quantity != null ? Number(product.stock_quantity) : null
  const stockLine =
    stockQty == null || stockQty <= 0
      ? ""
      : stockQty <= 5
        ? t("hub.stock.onlyLeft", { n: stockQty, defaultValue: "Only {{n}} left" })
        : t("hub.stock.left", { n: stockQty, defaultValue: "{{n}} left" })

  const guard = useGuardedAdd()
  const handleAddToCart = () => {
    if (!product?.vendor_id) return
    guard.add({ vendorId: product.vendor_id, serviceLineSlug: line as "food" | "mart", hubProductId: product.id, product })
  }

  const handleQuantityChange = (quantity: number) => {
    if (!product?.vendor_id || !cartItem) return
    void updateHubCartItemQuantity(product.vendor_id, cartItem.id, quantity).catch((e) => {
      showError(
        e instanceof Error ? e.message : t("hub.cart.updateFailed", { defaultValue: "Couldn't update cart" }),
      )
    })
  }

  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar style="dark" />
        {topBar}
        <ScreenScroll edges={["left", "right"]}>
          <View style={styles.skelImage} />
          <View style={[styles.skelBar, { width: "70%", height: 20, marginTop: 4 }]} />
          <View style={[styles.skelBar, { width: "40%", marginTop: 12 }]} />
          <View style={[styles.skelBar, { width: "100%", marginTop: 16 }]} />
          <View style={[styles.skelBar, { width: "85%" }]} />
        </ScreenScroll>
      </View>
    )
  }

  if (notFound || !product) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar style="dark" />
        {topBar}
        <ScreenScroll edges={["left", "right"]}>
          <EmptyState title={t("hub.productNotFound", { defaultValue: "Product not found." })} />
        </ScreenScroll>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      {topBar}
      {guard.dialog}
      <ScreenScroll
        edges={["left", "right"]}
        contentStyle={marketplace ? styles.contentWithCartBar : undefined}
      >
        <ProductGallery images={productImages(product)} />
        <Text style={styles.title}>{product.title}</Text>
        {stockLine ? <Text style={[styles.stock, product.stock_quantity != null && Number(product.stock_quantity) <= 5 && styles.stockLow]}>{stockLine}</Text> : null}
        {(product.fulfillment_mode === "delivery" ||
          product.fulfillment_mode === "pickup" ||
          product.sla_text) ? (
          <View style={styles.cueRow}>
            {product.fulfillment_mode === "delivery" || product.fulfillment_mode === "pickup" ? (
              <View style={styles.cueChip}>
                <Text style={styles.cueText}>
                  {t(`marketplace.${product.fulfillment_mode}`, {
                    defaultValue: String(product.fulfillment_mode).replace(/_/g, " "),
                  })}
                </Text>
              </View>
            ) : null}
            {product.sla_text ? (
              <View style={styles.cueChip}>
                <Text style={styles.cueText}>
                  {t("marketplace.usuallyWithin", {
                    defaultValue: "Usually within {{duration}}",
                    duration: String(product.sla_text).replace(/^(\d+):(\d{2}):\d{2}$/, "$1h $2m"),
                  })}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
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
        {product.long_description || product.short_description ? (
          <Text style={styles.desc}>{product.long_description || product.short_description}</Text>
        ) : null}

        <View style={styles.priceRow}>
          <PriceTag
            size="lg"
            prefix={
              product.pricing_type === "user_input"
                ? product.funded_min
                  ? t("hub.payFrom", { defaultValue: "Pay from" })
                  : t("hub.setAmount", { defaultValue: "Set amount" })
                : t("hub.sellPrice", { defaultValue: "Sell price" })
            }
            strike={product.pricing_type !== "user_input" && strike && list != null ? list : null}
            amount={product.pricing_type === "user_input" ? (product.funded_min ? product.funded_min : null) : price}
            currency={currency}
          />
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
                label={
                  soldOut
                    ? t("hub.soldOut", { defaultValue: "Sold out" })
                    : t("hub.cart.addToCart", { defaultValue: "Add to cart" })
                }
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
  // A plain 40px icon button in the top bar, the same size as the back chip and the cart button.
  barHeart: { position: "relative", top: 0, right: 0, width: 40, height: 40, borderRadius: 20, backgroundColor: "transparent", shadowOpacity: 0, elevation: 0 },
  skelImage: { width: "100%", aspectRatio: 4 / 3, borderRadius: radius.card, backgroundColor: colors.paper, marginBottom: 12 },
  skelBar: { height: 14, borderRadius: 7, backgroundColor: colors.paper, marginBottom: 8 },
  stock: { marginTop: 4, fontSize: typeSize.meta, fontWeight: "600", color: colors.muted },
  stockLow: { color: colors.warningText },
  // A small gap so the last content (the recommendations rail) doesn't end up pressed right up
  // against the floating cart bar — not a big empty void at the end of the scroll.
  contentWithCartBar: { paddingBottom: 56 },
  title: { fontSize: 20, fontWeight: "600", color: colors.text },
  cueRow: { marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  cueChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.surface,
  },
  cueText: { fontSize: 11, fontWeight: "600", color: colors.text, textTransform: "capitalize" },
  vendorHit: { marginTop: 6, alignSelf: "flex-start", maxWidth: "100%" },
  desc: { marginTop: 10, fontSize: typeSize.body, lineHeight: 22, color: colors.text },
  priceRow: { marginTop: 20 },
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
