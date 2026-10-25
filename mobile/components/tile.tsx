import { StyleSheet, Text, View } from "react-native"
import { PressableScale } from "@/components/ui/pressable-scale"
import { Image } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import { Briefcase, Gift, GraduationCap, Send, ShoppingBasket, Sparkles, Utensils, type LucideIcon } from "lucide-react-native"
import { colors, illustration, radius, type as typeSize } from "@/lib/theme"

/**
 * Service-line tile (Home grid), as in design-system/components/CustomerHome: 4:3 gradient artwork with a white
 * line icon, then title and one short line. Home always uses these drawn icons; Office image uploads are not shown.
 */
export type TileArt = { from: string; to: string; icon: LucideIcon }

export const TILE_ART: Record<string, TileArt> = {
  food: { ...illustration.tile.food, icon: Utensils },
  mart: { ...illustration.tile.mart, icon: ShoppingBasket },
  send: { ...illustration.tile.send, icon: Send },
  experts: { ...illustration.tile.experts, icon: GraduationCap },
  /** Hero slides (not tiles). */
  refer: { ...illustration.tile.refer, icon: Gift },
  pick: { ...illustration.tile.food, icon: Sparkles },
  offer: { ...illustration.tile.mart, icon: ShoppingBasket },
}

/** Art for a service-line slug. Unknown slugs get the neutral brown fallback. */
export function tileArtFor(slug: string): TileArt {
  const key = slug.trim().toLowerCase().replace(/_/g, "-")
  if (key === "send-money") return TILE_ART.send
  return TILE_ART[key] ?? { ...illustration.tile.fallback, icon: Briefcase }
}

export function Tile({
  title,
  description,
  iconUrl,
  slug,
  onPress,
  disabled,
}: {
  title: string
  description?: string | null
  iconUrl?: string | null
  slug?: string
  onPress?: () => void
  disabled?: boolean
}) {
  const art = tileArtFor(slug ?? "")
  const Icon = art.icon
  const inner = (
    <View style={styles.card}>
      <View style={styles.art}>
        <LinearGradient colors={[art.from, art.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        {iconUrl ? (
          <Image source={{ uri: iconUrl }} style={styles.artImage} contentFit="contain" />
        ) : (
          <Icon size={52} color={colors.onPrimary} strokeWidth={2} style={{ opacity: 0.9 }} />
        )}
      </View>
      <View style={styles.caption}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  )
  if (!onPress || disabled) return inner
  return (
    <PressableScale onPress={onPress} haptics style={styles.press} accessibilityRole="button" accessibilityLabel={description ? `${title}. ${description}` : title}>
      {inner}
    </PressableScale>
  )
}

export function TileSkeleton() {
  return <View style={[styles.card, styles.skeleton]} />
}

const styles = StyleSheet.create({
  press: { minHeight: 48, flex: 1 },
  card: {
    flex: 1,
    overflow: "hidden",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  // A tall artwork band so Home tiles read as cards, not chips. It still grows if the row is given more room.
  art: { flex: 1, minHeight: 96, alignItems: "center", justifyContent: "center" },
  artImage: { width: 56, height: 56 },
  caption: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 16, gap: 4 },
  skeleton: { minHeight: 176, backgroundColor: colors.surface },
  title: {
    fontSize: typeSize.body,
    fontWeight: "600",
    lineHeight: 20,
    color: colors.text,
  },
  // Two lines are always reserved, so tiles in a row keep the same artwork height whatever the copy length.
  desc: {
    fontSize: typeSize.meta,
    lineHeight: 18,
    minHeight: 36,
    color: colors.muted,
  },
})
