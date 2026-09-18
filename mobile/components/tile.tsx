import { Pressable, StyleSheet, Text, View } from "react-native"
import { Image } from "expo-image"
import { colors, radius, type as typeSize } from "@/lib/theme"

export function Tile({
  title,
  description,
  iconUrl,
  onPress,
  disabled,
}: {
  title: string
  description?: string | null
  iconUrl?: string | null
  onPress?: () => void
  disabled?: boolean
}) {
  const inner = (
    <View style={styles.card}>
      {iconUrl ? (
        <Image source={{ uri: iconUrl }} style={styles.icon} contentFit="contain" />
      ) : (
        <View style={styles.iconFallback} />
      )}
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      {description ? (
        <Text style={styles.desc} numberOfLines={2}>
          {description}
        </Text>
      ) : null}
    </View>
  )
  if (!onPress || disabled) return inner
  return (
    <Pressable onPress={onPress} style={styles.press} accessibilityRole="button">
      {inner}
    </Pressable>
  )
}

export function TileSkeleton() {
  return <View style={[styles.card, styles.skeleton]} />
}

const styles = StyleSheet.create({
  press: { minHeight: 48 },
  card: {
    minHeight: 148,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  skeleton: { backgroundColor: colors.surface },
  icon: { width: 56, height: 56 },
  iconFallback: { width: 56, height: 56, borderRadius: 12, backgroundColor: colors.paper },
  title: {
    marginTop: 8,
    width: "100%",
    textAlign: "center",
    fontSize: typeSize.meta,
    fontWeight: "600",
    lineHeight: 18,
    color: colors.text,
  },
  desc: {
    marginTop: 4,
    width: "100%",
    textAlign: "center",
    fontSize: 12,
    lineHeight: 16,
    color: colors.muted,
  },
})
