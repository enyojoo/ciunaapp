import { Highlighted } from "@/components/highlight"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { Image } from "expo-image"
import { MapPin } from "lucide-react-native"
import { VerifiedBadge } from "@/components/verified-badge"
import { LinearGradient } from "expo-linear-gradient"
import { tileArtFor } from "@/components/tile"
import { useTranslation } from "react-i18next"
import { colors, radius, shadow, type as typeSize } from "@/lib/theme"
import { FavouriteHeart } from "@/components/favourite-heart"
import type { HubVendor } from "@/lib/types"

export function StoreChip({
  vendor,
  onPress,
}: {
  vendor: HubVendor
  onPress: () => void
}) {
  const { t } = useTranslation("app")
  return (
    <View style={styles.stripHit}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={vendor.name}>
        <StoreFace vendor={vendor} verifiedLabel={t("hub.verifiedVendor", { defaultValue: "Verified vendor" })} compact />
      </Pressable>
      <FavouriteHeart type="vendor" id={vendor.id} />
    </View>
  )
}

export function StoreGridCard({
  vendor,
  onPress,
}: {
  vendor: HubVendor
  onPress: () => void
}) {
  const { t } = useTranslation("app")
  return (
    <View style={styles.gridHit}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={vendor.name}>
        <StoreFace vendor={vendor} verifiedLabel={t("hub.verifiedVendor", { defaultValue: "Verified vendor" })} showLocation />
      </Pressable>
      <FavouriteHeart type="vendor" id={vendor.id} />
    </View>
  )
}

export function StoreChipSkeleton() {
  return <View style={[styles.stripHit, styles.stripSkeleton]} />
}

export function StoreGridSkeleton() {
  return <View style={[styles.gridHit, styles.gridSkeleton]} />
}

function StoreFace({
  vendor,
  verifiedLabel,
  compact,
  showLocation,
}: {
  vendor: HubVendor
  verifiedLabel: string
  compact?: boolean
  showLocation?: boolean
}) {
  const { t } = useTranslation("app")
  const art = tileArtFor(vendor.service_line_slug || "food")
  const loc = (vendor.location || "").trim()
  const count = Number(vendor.rating_count ?? 0)
  const avg = Number(vendor.rating_avg ?? 0)
  const rated = count > 0 && Number.isFinite(avg)
  const closed = Boolean(vendor.hours_configured) && vendor.is_open === false
  return (
    <View style={[styles.card, compact ? styles.cardRail : styles.cardGrid]}>
      {/* Cover: the line's art, the design's stand-in until stores upload covers. */}
      <View style={[styles.cover, compact ? styles.coverRail : styles.coverGrid]}>
        {vendor.cover_url ? (
          <Image source={{ uri: vendor.cover_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <LinearGradient colors={[art.from, art.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        )}
        {closed ? (
          <View style={styles.closedShade}>
            <View style={styles.closedChip}>
              <Text style={styles.closedText}>{t("hub.store.closed", { defaultValue: "Closed" })}</Text>
            </View>
          </View>
        ) : null}
      </View>
      {/* Logo: round, white ring, overlapping the cover. */}
      <View style={styles.logoWrap}>
        {vendor.photo_url ? (
          <Image source={{ uri: vendor.photo_url }} style={styles.logo} contentFit="cover" />
        ) : (
          <Text style={styles.logoInitial}>{(vendor.name.trim().charAt(0) || "?").toUpperCase()}</Text>
        )}
      </View>
      <View style={styles.caption}>
        <View style={styles.nameRow}>
          <Highlighted style={styles.name} numberOfLines={1} ellipsizeMode="tail" text={vendor.name} />
          {vendor.is_verified ? <VerifiedBadge size={14} label={vendor.verification_tier === 2 ? undefined : verifiedLabel} tier={vendor.verification_tier} /> : null}
        </View>
        <Text style={styles.rating} numberOfLines={1}>
          {rated
            ? `★ ${avg.toFixed(1)} (${count})`
            : t("hub.store.newStore", { defaultValue: "New store" })}
        </Text>
        {showLocation && loc ? (
          <View style={styles.locRow}>
            <MapPin size={12} color={colors.muted} strokeWidth={2} />
            <Text style={styles.loc} numberOfLines={1} ellipsizeMode="tail">
              {loc}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  closedShade: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(17,24,39,0.35)", justifyContent: "flex-end", alignItems: "flex-end", padding: 8 },
  closedChip: { borderRadius: radius.pill, backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 3 },
  closedText: { fontSize: 12, fontWeight: "700", color: colors.text },
  stripHit: { width: 200 },
  stripSkeleton: { height: 180, borderRadius: radius.card, backgroundColor: colors.paper },
  gridHit: { width: "48.5%", marginBottom: 12 },
  gridSkeleton: { aspectRatio: 0.85, borderRadius: radius.card, backgroundColor: colors.paper },
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
    paddingBottom: 12,
  },
  cardRail: { width: 200 },
  cardGrid: { width: "100%" },
  cover: { width: "100%" },
  coverRail: { height: 96 },
  coverGrid: { height: 84 },
  logoWrap: {
    marginTop: -24,
    marginLeft: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.surface,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: { width: "100%", height: "100%" },
  logoInitial: { fontSize: 18, fontWeight: "700", color: colors.primaryText },
  caption: { paddingHorizontal: 12, paddingTop: 6, gap: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4, minWidth: 0 },
  name: { flexShrink: 1, minWidth: 0, fontSize: 15, fontWeight: "700", color: colors.text },
  rating: { fontSize: 12, lineHeight: 16, fontWeight: "600", color: colors.text },
  locRow: { marginTop: 2, flexDirection: "row", alignItems: "center", gap: 4, minWidth: 0 },
  loc: { flexShrink: 1, minWidth: 0, fontSize: 12, lineHeight: 16, color: colors.muted },
})
