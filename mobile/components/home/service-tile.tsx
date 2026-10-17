import { StyleSheet, View } from "react-native"
import { Image } from "expo-image"
import { AppText, Icon, PressableScale, type IconName } from "@/components/ui"
import { elevation, colors, radius, space } from "@/lib/theme"

/** Fallback glyph for a service line that has no uploaded artwork. */
const SLUG_ICON: Record<string, IconName> = { food: "food", mart: "mart", send: "send", "send-money": "send", experts: "experts" }

function glyphFor(slug: string): IconName {
  return SLUG_ICON[slug.trim().toLowerCase().replace(/_/g, "-")] ?? "globe"
}

/**
 * Home service tile. Shows the artwork uploaded in Office (Hub Services) at a large size, with the drawn glyph
 * only as a fallback. Square-ish and fixed in shape so the grid never leaves dead gaps on tall screens.
 */
export function ServiceTile({ title, iconUrl, slug, onPress }: { title: string; iconUrl?: string | null; slug: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} haptics accessibilityRole="button" accessibilityLabel={title} style={styles.tile}>
      <View style={styles.art}>
        {iconUrl ? (
          <Image source={{ uri: iconUrl }} style={styles.image} contentFit="contain" accessibilityIgnoresInvertColors />
        ) : (
          <View style={styles.well}>
            <Icon name={glyphFor(slug)} size={34} color={colors.primaryText} />
          </View>
        )}
      </View>
      <AppText variant="bodyStrong" numberOfLines={2} style={styles.title}>
        {title}
      </AppText>
    </PressableScale>
  )
}

export function ServiceTileSkeleton() {
  return <View style={[styles.tile, styles.skeleton]} />
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 148,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.cardEdge,
    padding: space.lg,
    justifyContent: "space-between",
    ...elevation.raised,
  },
  skeleton: { backgroundColor: colors.fill, borderColor: colors.border, shadowOpacity: 0, elevation: 0 },
  art: { flex: 1, alignItems: "flex-start", justifyContent: "center", paddingBottom: space.sm },
  image: { width: 72, height: 72 },
  well: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.primaryTint, alignItems: "center", justifyContent: "center" },
  title: { minHeight: 22 },
})
