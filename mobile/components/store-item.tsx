import { Pressable, StyleSheet, Text, View } from "react-native"
import { Image } from "expo-image"
import { BadgeCheck, MapPin } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { colors, radius, type as typeSize } from "@/lib/theme"
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
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={vendor.name} style={styles.stripHit}>
      <StoreFace vendor={vendor} verifiedLabel={t("hub.verifiedVendor", { defaultValue: "Verified vendor" })} compact />
    </Pressable>
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
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={vendor.name} style={styles.gridHit}>
      <StoreFace vendor={vendor} verifiedLabel={t("hub.verifiedVendor", { defaultValue: "Verified vendor" })} showLocation />
    </Pressable>
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
  const loc = (vendor.location || "").trim()
  return (
    <View style={styles.card}>
      <View style={styles.photo}>
        {vendor.photo_url ? (
          <Image source={{ uri: vendor.photo_url }} style={styles.photoImg} contentFit="cover" />
        ) : (
          <View style={styles.photoFallback}>
            <Text style={styles.photoFallbackText} numberOfLines={2}>
              {vendor.name}
            </Text>
          </View>
        )}
      </View>
      <View style={[styles.caption, compact ? styles.captionCompact : styles.captionGrid]}>
        <View style={[styles.nameRow, compact ? styles.nameCenter : styles.nameStart]}>
          <Text style={[styles.name, compact ? styles.nameCompact : styles.nameGrid]} numberOfLines={1} ellipsizeMode="tail">
            {vendor.name}
          </Text>
          {vendor.is_verified ? (
            <View style={styles.check}>
              <BadgeCheck size={12} color={colors.primary} strokeWidth={2.2} accessibilityLabel={verifiedLabel} />
            </View>
          ) : null}
        </View>
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
  stripHit: { width: 120 },
  stripSkeleton: {
    aspectRatio: 0.82,
    borderRadius: radius.card,
    backgroundColor: colors.paper,
  },
  gridHit: { width: "48.5%", marginBottom: 12 },
  gridSkeleton: { aspectRatio: 0.85, borderRadius: radius.card, backgroundColor: colors.paper },
  card: {
    overflow: "hidden",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  photo: { width: "100%", aspectRatio: 1, backgroundColor: colors.paper },
  photoImg: { width: "100%", height: "100%" },
  photoFallback: { flex: 1, alignItems: "center", justifyContent: "center", padding: 8 },
  photoFallbackText: { fontSize: 11, fontWeight: "600", color: colors.muted, textAlign: "center" },
  caption: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  captionCompact: { paddingHorizontal: 8, paddingVertical: 8 },
  captionGrid: { paddingHorizontal: 12, paddingVertical: 12 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4, minWidth: 0 },
  nameCenter: { justifyContent: "center" },
  nameStart: { justifyContent: "flex-start" },
  name: { flexShrink: 1, minWidth: 0, fontWeight: "600", color: colors.text },
  nameCompact: { fontSize: 12, lineHeight: 16 },
  nameGrid: { fontSize: typeSize.meta, lineHeight: 18 },
  check: { flexShrink: 0 },
  locRow: { marginTop: 4, flexDirection: "row", alignItems: "center", gap: 4, minWidth: 0 },
  loc: { flexShrink: 1, minWidth: 0, fontSize: 11, lineHeight: 15, color: colors.muted },
})
