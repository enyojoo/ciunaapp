import { useEffect } from "react"
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native"
import { StatusBar } from "expo-status-bar"
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { BadgeCheck, MapPin } from "lucide-react-native"
import { CatalogProducts } from "@/components/catalog-products"
import { EmptyState } from "@/components/empty-state"
import { HubCartBar } from "@/components/hub-cart-bar"
import { HubCartHeaderButton } from "@/components/hub-cart-header-button"
import { ScreenScroll } from "@/components/screen"
import { hubProductDetailPath, isHubMarketplaceSlug } from "@/lib/hub"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useHubVendorStorefront } from "@/lib/use-hub-vendor"
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
  const { t } = useTranslation("app")
  const { data, loading, error, revalidate } = useHubVendorStorefront(line, vendorSlug)
  const products = data?.products || []
  const vendor = data?.vendor || null
  const notFound = !loading && (Boolean(error) || (!vendor && products.length === 0))

  useFocusRevalidate(revalidate)
  useRevalidateOnForeground(revalidate)

  const cartMode = isHubMarketplaceSlug(line)
  const vendorId = (vendor as (HubVendor & { id?: string }) | null)?.id ?? null

  useEffect(() => {
    // No title — the vendor name is already the big heading in the body; a repeated header title is redundant.
    navigation.setOptions({
      title: "",
      headerRight: cartMode ? () => <HubCartHeaderButton lineSlug={line as "food" | "mart"} variant="plain" /> : undefined,
    })
  }, [navigation, cartMode, line])

  if (loading && !vendor) {
    return (
      <ScreenScroll edges={["left", "right"]}>
        <StatusBar style="dark" />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
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

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <ScreenScroll edges={["left", "right"]} contentStyle={cartMode ? styles.contentWithCartBar : undefined}>
        <View style={styles.identityRow}>
          <View style={styles.logoWrap}>
            {vendor?.photo_url ? (
              <Image source={{ uri: vendor.photo_url }} style={styles.logo} resizeMode="cover" />
            ) : null}
          </View>
          <View style={styles.identityBody}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={2}>
                {vendor?.name}
              </Text>
              {vendor?.is_verified ? (
                <BadgeCheck
                  size={18}
                  color={colors.primary}
                  strokeWidth={2.2}
                  accessibilityLabel={t("hub.verifiedVendor", { defaultValue: "Verified vendor" })}
                />
              ) : null}
            </View>
            {location ? (
              <View style={styles.locRow}>
                <MapPin size={14} color={colors.muted} strokeWidth={2} />
                <Text style={styles.loc} numberOfLines={1}>
                  {location}
                </Text>
              </View>
            ) : null}
            <Text style={styles.productCount}>
              {t("hub.vendorProductCount", { defaultValue: "{{count}} products", count: products.length })}
            </Text>
          </View>
        </View>

        {bio ? (
          <View style={styles.bioFrame}>
            <Text style={styles.bio}>{bio}</Text>
          </View>
        ) : null}

        {notes || pickupLocation || pickupHours ? (
          <View style={styles.notesFrame}>
            {notes ? (
              <>
                <Text style={styles.notesLabel}>
                  {t("marketplace.fulfillmentNotes", { defaultValue: "Fulfillment notes" })}
                </Text>
                <Text style={styles.notesBody}>{notes}</Text>
              </>
            ) : null}
            {pickupLocation ? (
              <Text style={styles.notesBody}>
                {t("marketplace.pickupLocation", { defaultValue: "Pickup location" })}: {pickupLocation}
              </Text>
            ) : null}
            {pickupHours ? (
              <Text style={styles.notesBody}>
                {t("marketplace.pickupHours", { defaultValue: "Pickup hours" })}: {pickupHours}
              </Text>
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
      </ScreenScroll>
      {cartMode ? <HubCartBar lineSlug={line as "food" | "mart"} vendorId={vendorId} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  center: { paddingVertical: 60, alignItems: "center" },
  contentWithCartBar: { paddingBottom: 56 },
  identityRow: { flexDirection: "row", gap: 14, marginBottom: 16 },
  logoWrap: {
    width: 76,
    height: 76,
    borderRadius: radius.card,
    overflow: "hidden",
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logo: { width: "100%", height: "100%" },
  identityBody: { flex: 1, minWidth: 0, justifyContent: "center", gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  name: { flexShrink: 1, fontSize: 20, fontWeight: "700", letterSpacing: -0.3, color: colors.text },
  locRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  loc: { flexShrink: 1, fontSize: typeSize.meta, color: colors.muted },
  productCount: { fontSize: typeSize.meta, color: colors.muted },
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
