import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native"
import { Image, type ImageContentFit } from "expo-image"
import { Icon, type IconName } from "@/components/ui/icon"
import { colors } from "@/lib/theme"

/**
 * Every product, store and banner photo goes through this. It fades the image in, keeps its frame while loading, and
 * when there is no photo draws a warm neutral plate with a category glyph instead of "No image" text.
 */
export function Media({
  uri,
  fallback = "mart",
  aspectRatio,
  width = "100%",
  height,
  rounded = 0,
  contentFit = "cover",
  blurhash,
  style,
  accessibilityLabel,
}: {
  uri?: string | null
  /** Glyph shown on the plate when there is no photo: `food`, `mart`, `experts`, … */
  fallback?: IconName
  /** Width / height, e.g. 4 / 3 for product cards. Ignored when `height` is set. */
  aspectRatio?: number
  width?: DimensionValue
  height?: number
  rounded?: number
  contentFit?: ImageContentFit
  blurhash?: string | null
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
}) {
  const src = uri?.trim()
  const frame: StyleProp<ViewStyle> = [
    styles.frame,
    { width, borderRadius: rounded },
    height != null ? { height } : aspectRatio ? { aspectRatio } : null,
    style,
  ]
  if (!src) {
    return (
      <View style={[frame, styles.plate]} accessibilityLabel={accessibilityLabel} accessibilityRole={accessibilityLabel ? "image" : undefined}>
        <Icon name={fallback} size={28} color={colors.subtle} />
      </View>
    )
  }
  return (
    <View style={frame}>
      <Image
        source={{ uri: src }}
        placeholder={blurhash ? { blurhash } : undefined}
        contentFit={contentFit}
        transition={200}
        style={StyleSheet.absoluteFill}
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  frame: { overflow: "hidden", backgroundColor: colors.fill },
  plate: { alignItems: "center", justifyContent: "center" },
})
