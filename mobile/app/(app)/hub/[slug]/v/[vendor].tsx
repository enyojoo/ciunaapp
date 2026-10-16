import { LinearGradient } from "expo-linear-gradient"
import { tileArtFor } from "@/components/tile"
import { useEffect } from "react"
import { Image, StyleSheet, Text, View } from "react-native"
import { StatusBar } from "expo-status-bar"
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Clock, Info, MapPin, ShoppingBag } from "lucide-react-native"
import { VerifiedBadge } from "@/components/verified-badge"
import { FavouriteHeart } from "@/components/favourite-heart"
import { RatingLine, ReviewsSection } from "@/components/reviews-section"
import { useReviews } from "@/lib/use-reviews"
import { CatalogProducts } from "@/components/catalog-products"
import { EmptyState } from "@/components/empty-state"
import { HubCartBar } from "@/components/hub-cart-bar"
import { HubCartHeaderButton } from "@/components/hub-cart-header-button"
import { ScreenScroll } from "@/components/screen"
import { hubProductDetailPath, isHubMarketplaceSlug } from "@/lib/hub"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useHubVendorStorefront } from "@/lib/use-hub-vendor"
import { StoreHeader } from "@/components/store-header"
import { formatCardPrice } from "@/lib/money"
import { useRevalidateOnForeground } from "@/lib/use-revalidate-on-foreground"
import type { HubVendor } from "@/lib/types"
import { colors, radius, type as typeSize } from "@/lib/theme"

/**
 * Store profile — same header treatment as the product screen (plain native header, not the
 * orange gradient hero): the gradient is reserved for the service-line screens (Home → Food/Mart).
 * A vendor storefront and an expert profile are both "somewhere you land and stay a while", not a
 * browsing entry point, so they get the richer, quieter, profile-style treatment instead.
 */
export default function VendorScreen() {
  const { slug, vendor: vendorParam } = useLocalSearchParams<{ slug: string; vendor: string }>()
  const line = String(slug || "").toLowerCase()
  const vendorSlug = String(vendorParam || "")
  const navigation = useNavigation()
  const router = useRouter()
  const { t, i18n } = useTranslation("app")
  const { data, loading, error, revalidate } = useHubVendorStorefront(line, vendorSlug)
  const products = data?.products || []
  const vendor = data?.vendor || null
  const notFound = !loading && (Boolean(error) || (!vendor && products.length === 0))

  useFocusRevalidate(revalidate)
  useRevalidateOnForeground(revalidate)

  const cartMode = isHubMarketplaceSlug(line)
  const vendorId = (vendor as (HubVendor & { id?: string }) | null)?.id ?? null

  const reviews = useReviews(vendor && isHubMarketplaceSlug(line) ? { kind: "vendor", line, slug: vendorSlug } : null)

  useEffect(() => {
    // No title — the vendor name is already the big heading in the body; a repeated header title is redundant.
    navigation.setOptions({
      title: "",
      headerRight:
        cartMode || vendorId
          ? () => (
              <View style={styles.headerRight}>
                {vendorId ? <FavouriteHeart type="vendor" id={vendorId} style={styles.headerHeart} /> : null}
                {cartMode ? <HubCartHeaderButton lineSlug={line as "food" | "mart"} variant="plain" /> : null}
              </View>
            )
          : undefined,
    })
  }, [navigation, cartMode, line, vendorId])

  if (loading && !vendor) {
    return (
      <ScreenScroll edges={["left", "right"]}>
        <StatusBar style="dark" />
        <StoreHeader vendor={null} line={line} summary={null} productCount={0} skeleton />
      </ScreenScroll>
    )
  }

  if (notFound && !vendor) {
    return (
      <ScreenScroll edges={["left", "right"]}>
        <StatusBar style="dark" />
        <EmptyState
          title={t("hub.vendorStoreNotFound", { defaultValue: "Store not found" })}
          body={t("hub.vendorStoreNotFoundBody", {
            defaultValue: "This store is unavailable or the link may be incorrect.",
          })}
        />
      </ScreenScroll>
    )
  }

  const bio = (vendor?.short_bio || "").trim()
  const location = (vendor?.location || "").trim()
  const notes = (vendor?.fulfillment_notes || "").trim()
  const pickupLocation = (vendor?.pickup_location || "").trim()
  const pickupHours = (vendor?.pickup_hours || "").trim()
  const minOrder =
    vendor?.min_order_amount != null && vendor.min_order_currency
      ? t("hub.store.minOrder", { min: formatCardPrice(vendor.min_order_amount, vendor.min_order_currency), defaultValue: "Minimum order for delivery: {{min}}" })
      : ""

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <ScreenScroll edges={["left", "right"]} contentStyle={cartMode ? styles.contentWithCartBar : undefined}>
        <StoreHeader vendor={vendor} line={line} summary={reviews.summary} productCount={products.length} />

        {bio ? (
          <View style={styles.bioFrame}>
            <Text style={styles.bio}>{bio}</Text>
          </View>
        ) : null}

        {notes || pickupLocation || pickupHours || minOrder ? (
          <View style={styles.infoPlate}>
            {minOrder ? (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <ShoppingBag size={16} color={colors.primaryText} strokeWidth={2.2} />
                </View>
                <View style={styles.infoBody}>
                  <Text style={styles.infoValue}>{minOrder}</Text>
                </View>
              </View>
            ) : null}
            {pickupLocation ? (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <MapPin size={16} color={colors.primaryText} strokeWidth={2.2} />
                </View>
                <View style={styles.infoBody}>
                  <Text style={styles.infoLabel}>{t("marketplace.pickupLocation", { defaultValue: "Pickup location" })}</Text>
                  <Text style={styles.infoValue}>{pickupLocation}</Text>
                </View>
              </View>
            ) : null}
            {pickupHours ? (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Clock size={16} color={colors.primaryText} strokeWidth={2.2} />
                </View>
                <View style={styles.infoBody}>
                  <Text style={styles.infoLabel}>{t("marketplace.pickupHours", { defaultValue: "Pickup hours" })}</Text>
                  <Text style={styles.infoValue}>{pickupHours}</Text>
                </View>
              </View>
            ) : null}
            {notes ? (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Info size={16} color={colors.primaryText} strokeWidth={2.2} />
                </View>
                <View style={styles.infoBody}>
                  <Text style={styles.infoLabel}>{t("marketplace.fulfillmentNotes", { defaultValue: "Fulfillment notes" })}</Text>
                  <Text style={styles.infoValue}>{notes}</Text>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {notFound && !vendor ? null : (
          <CatalogProducts
            products={products}
            loading={loading}
            showVendor={false}
            showCategory
            onProductPress={(p) => router.push(hubProductDetailPath(line, p.id) as never)}
            cartLineSlug={cartMode ? (line as "food" | "mart") : undefined}
          />
        )}
        {vendor ? <ReviewsSection state={reviews} /> : null}
      </ScreenScroll>
      {cartMode ? <HubCartBar lineSlug={line as "food" | "mart"} vendorId={vendorId} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  infoPlate: { marginTop: 16, marginBottom: 20, backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 14 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  infoIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryTint, alignItems: "center", justifyContent: "center" },
  infoBody: { flex: 1, minWidth: 0, gap: 2 },
  infoLabel: { fontSize: 12, fontWeight: "600", color: colors.muted },
  infoValue: { fontSize: 15, lineHeight: 21, color: colors.text },
  cover: { height: 128, borderRadius: 20, overflow: "hidden", backgroundColor: colors.paper },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerHeart: { position: "relative", top: 0, right: 0, backgroundColor: "transparent" },
  skelFill: { backgroundColor: colors.paper, borderColor: colors.paper },
  skelBar: { height: 14, borderRadius: 7, backgroundColor: colors.paper },
  contentWithCartBar: { paddingBottom: 56 },
  bioFrame: {
    marginBottom: 24,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  bio: { fontSize: typeSize.body, lineHeight: 22, color: colors.text },
  notesFrame: {
    marginBottom: 24,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  notesLabel: { fontSize: 12, fontWeight: "700", color: colors.text },
  notesBody: { fontSize: typeSize.meta, lineHeight: 18, color: colors.text },
})
