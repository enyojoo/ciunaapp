import { Pressable, StyleSheet, Text, View } from "react-native"
import { Image } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import { Briefcase, GraduationCap, Send, ShoppingBasket, Utensils, type LucideIcon } from "lucide-react-native"
import { colors, radius, type as typeSize } from "@/lib/theme"

/**
 * Service-line tile (Home grid), as in design-system/components/CustomerHome: 4:3 gradient artwork with a white
 * line icon, then title and one short line. Office `icon_url` replaces the drawn icon when set.
 */
export type TileArt = { from: string; to: string; icon: LucideIcon }

export const TILE_ART: Record<string, TileArt> = {
  food: { from: "#F3B47A", to: "#D9622B", icon: Utensils },
  mart: { from: "#9FCB8A", to: "#3F8A55", icon: ShoppingBasket },
  send: { from: "#8FB8D9", to: "#3F6F9C", icon: Send },
  experts: { from: "#D9A3C7", to: "#9C4F83", icon: GraduationCap },
}

/** Art for a service-line slug. Unknown slugs get the neutral brown fallback. */
export function tileArtFor(slug: string): TileArt {
  const key = slug.trim().toLowerCase().replace(/_/g, "-")
  if (key === "send-money") return TILE_ART.send
  return TILE_ART[key] ?? { from: "#B7A58F", to: "#6F5B47", icon: Briefcase }
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
          <Icon size={56} color="#FFFFFF" strokeWidth={2} style={{ opacity: 0.9 }} />
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
    <Pressable onPress={onPress} style={({ pressed }) => [styles.press, pressed && styles.pressed]} accessibilityRole="button">
      {inner}
    </Pressable>
  )
}

export function TileSkeleton() {
  return <View style={[styles.card, styles.skeleton]} />
}

const styles = StyleSheet.create({
  press: { minHeight: 48, flex: 1 },
  pressed: { opacity: 0.85 },
  card: {
    flex: 1,
    overflow: "hidden",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  art: { aspectRatio: 4 / 3, alignItems: "center", justifyContent: "center" },
  artImage: { width: 56, height: 56 },
  caption: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12, gap: 2 },
  skeleton: { minHeight: 180, backgroundColor: colors.surface },
  title: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
    color: colors.text,
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
})
