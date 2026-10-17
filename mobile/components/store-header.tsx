import { Image, StyleSheet, Text, View, useWindowDimensions } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { MapPin } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { tileArtFor } from "@/components/tile"
import { VerifiedBadge } from "@/components/verified-badge"
import { storeOpenLine } from "@/lib/store-hours"
import type { ReviewSummary } from "@/lib/use-reviews"
import type { HubVendor } from "@/lib/types"
import { colors, radius, type as typeSize } from "@/lib/theme"

const LOGO = 76
const OVERLAP = 40

/** Cover height follows the screen width (about a 3:1 banner), within limits, so every store's header matches on a given device. */
export function coverHeight(windowWidth: number): number {
  return Math.round(Math.min(160, Math.max(112, windowWidth * 0.34)))
}

/**
 * Store header with fixed slots, so two stores always have the same header height: cover, round logo
 * overlapping it, then one line each for the name (ellipsis), the location and a status line that
 * holds the open state, rating and product count. A slot with nothing to show stays empty.
 */
export function StoreHeader({
  vendor,
  line,
  summary,
  productCount,
  skeleton,
}: {
  vendor: HubVendor | null
  line: string
  summary: ReviewSummary | null
  productCount: number
  /** Same dimensions as the loaded header, with grey blocks instead of content. */
  skeleton?: boolean
}) {
  const { t, i18n } = useTranslation("app")
  const { width } = useWindowDimensions()
  const open = vendor ? storeOpenLine(vendor, t, i18n.language) : null
  const location = (vendor?.location || "").trim()
  const rated = Boolean(summary && summary.count && summary.avg != null)

  if (skeleton) {
    return (
      <View>
        <View style={[styles.cover, { height: coverHeight(width) }]} />
        <View style={styles.row}>
          <View style={[styles.logoWrap, styles.skelFill]} />
          <View style={styles.body}>
            <View style={styles.nameSlot}>
              <View style={[styles.skelBar, { width: "60%", height: 20 }]} />
            </View>
            <View style={styles.locSlot}>
              <View style={[styles.skelBar, { width: "40%" }]} />
            </View>
            <View style={styles.statusSlot}>
              <View style={[styles.skelBar, { width: "50%" }]} />
            </View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View>
      <View style={[styles.cover, { height: coverHeight(width) }]}>
        {vendor?.cover_url ? (
          <Image source={{ uri: vendor.cover_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={[tileArtFor(line).from, tileArtFor(line).to]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        {open ? (
          <View style={styles.coverChip}>
            <Text style={[styles.chipText, open.open ? styles.chipTextOn : styles.chipTextOff]} numberOfLines={1}>
              {open.text}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.row}>
        <View style={styles.logoWrap}>
          {vendor?.photo_url ? (
            <Image source={{ uri: vendor.photo_url }} style={styles.logo} resizeMode="cover" />
          ) : (
            <Text style={styles.logoInitial}>{(vendor?.name || "?").trim().charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.body}>
          <View style={styles.nameSlot}>
            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
              {vendor?.name}
            </Text>
            {vendor?.is_verified ? <VerifiedBadge size={18} tier={vendor.verification_tier} explain /> : null}
          </View>
          <View style={styles.locSlot}>
            {location ? (
              <>
                <MapPin size={14} color={colors.muted} strokeWidth={2} />
                <Text style={styles.loc} numberOfLines={1} ellipsizeMode="tail">
                  {location}
                </Text>
              </>
            ) : null}
          </View>
          <View style={styles.statusSlot}>
            <Text style={styles.meta} numberOfLines={1}>
              {rated ? `★ ${(summary!.avg as number).toFixed(1)} (${summary!.count})` : t("hub.store.newStore", { defaultValue: "New store" })}
              {" · "}
              {t("hub.vendorProductCount", { defaultValue: "{{count}} products", count: productCount })}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  skelFill: { backgroundColor: colors.paper, borderColor: colors.paper },
  skelBar: { height: 14, borderRadius: 7, backgroundColor: colors.paper },
  cover: { borderRadius: 20, overflow: "hidden", backgroundColor: colors.paper },
  row: { flexDirection: "row", gap: 14, marginTop: -OVERLAP, paddingHorizontal: 4, marginBottom: 16 },
  logoWrap: {
    width: LOGO,
    height: LOGO,
    borderRadius: LOGO / 2,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: "100%", height: "100%" },
  logoInitial: { fontSize: 22, fontWeight: "700", color: colors.primaryText, textAlign: "center" },
  // Starts below the cover edge: only the logo overlaps the cover.
  body: { flex: 1, minWidth: 0, marginTop: OVERLAP + 4 },
  nameSlot: { height: 28, flexDirection: "row", alignItems: "center", gap: 6 },
  name: { flexShrink: 1, fontSize: 20, fontWeight: "700", letterSpacing: -0.3, color: colors.text },
  locSlot: { height: 20, flexDirection: "row", alignItems: "center", gap: 5 },
  loc: { flexShrink: 1, fontSize: typeSize.meta, color: colors.muted },
  statusSlot: { height: 22, flexDirection: "row", alignItems: "center" },
  coverChip: { position: "absolute", right: 10, bottom: 10, maxWidth: "70%", borderRadius: radius.pill, backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 12, fontWeight: "600" },
  chipTextOn: { color: "#047857" },
  chipTextOff: { color: "#4B5563" },
  meta: { flexShrink: 1, fontSize: typeSize.meta, color: colors.muted },
})
