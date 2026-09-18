import { Pressable, StyleSheet, Text, View } from "react-native"
import { Image } from "expo-image"
import { colors, radius, type as typeSize } from "@/lib/theme"
import type { HubVendor } from "@/lib/types"

export function StoreChip({
  vendor,
  onPress,
}: {
  vendor: HubVendor
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={vendor.name} style={styles.chipHit}>
      <View style={styles.chipInner}>
        {vendor.photo_url ? (
          <Image source={{ uri: vendor.photo_url }} style={styles.avatarLg} contentFit="cover" />
        ) : (
          <View style={styles.avatarLgFallback} />
        )}
        <Text style={styles.chipName} numberOfLines={2}>
          {vendor.name}
        </Text>
      </View>
    </Pressable>
  )
}

export function StoreRow({
  vendor,
  onPress,
}: {
  vendor: HubVendor
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={vendor.name}>
      <View style={styles.row}>
        {vendor.photo_url ? (
          <Image source={{ uri: vendor.photo_url }} style={styles.avatarSm} contentFit="cover" />
        ) : (
          <View style={styles.avatarSmFallback} />
        )}
        <View style={styles.rowText}>
          <Text style={styles.rowName} numberOfLines={1}>
            {vendor.name}
          </Text>
          {vendor.location ? (
            <Text style={styles.rowMeta} numberOfLines={1}>
              {vendor.location}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chipHit: { width: 80, minHeight: 48 },
  chipInner: { alignItems: "center" },
  avatarLg: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.paper },
  avatarLgFallback: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipName: { marginTop: 6, width: "100%", textAlign: "center", fontSize: 12, lineHeight: 16, color: colors.text },
  row: {
    minHeight: 72,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  avatarSm: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.paper },
  avatarSmFallback: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.paper },
  rowText: { flex: 1, marginLeft: 12 },
  rowName: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  rowMeta: { marginTop: 2, fontSize: typeSize.meta, color: colors.muted },
})
