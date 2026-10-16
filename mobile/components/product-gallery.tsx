import { useState } from "react"
import { FlatList, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native"
import { Image } from "expo-image"
import { useTranslation } from "react-i18next"
import { colors, radius, type as typeSize } from "@/lib/theme"

/** Image urls for a product: the main image first, then the gallery (strings or { url } objects), without repeats. */
export function productImages(product: { image_url?: string | null; gallery?: unknown }): string[] {
  const out: string[] = []
  const add = (u: unknown) => {
    const url = typeof u === "string" ? u : u && typeof u === "object" ? (u as { url?: unknown }).url : null
    if (typeof url === "string" && url.trim() && !out.includes(url)) out.push(url)
  }
  add(product.image_url)
  if (Array.isArray(product.gallery)) product.gallery.forEach(add)
  return out
}

/** One photo, or a swipeable set with dots. Falls back to a "No image" plate. */
export function ProductGallery({ images }: { images: string[] }) {
  const { t } = useTranslation("app")
  const [width, setWidth] = useState(0)
  const [index, setIndex] = useState(0)

  if (images.length === 0) {
    return (
      <View style={[styles.frame, styles.fallback]}>
        <Text style={styles.noImage}>{t("hub.noImage", { defaultValue: "No image" })}</Text>
      </View>
    )
  }
  if (images.length === 1) {
    return (
      <View style={styles.frame}>
        <Image source={{ uri: images[0] }} style={styles.img} contentFit="cover" />
      </View>
    )
  }
  return (
    <View style={styles.frame} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <FlatList
          data={images}
          keyExtractor={(u) => u}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          renderItem={({ item }) => <Image source={{ uri: item }} style={{ width, height: "100%" }} contentFit="cover" />}
        />
      ) : null}
      <View style={styles.dots} pointerEvents="none">
        {images.map((u, i) => (
          <View key={u} style={[styles.dot, i === index && styles.dotOn]} />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  frame: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: radius.card,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: colors.paper,
  },
  img: { width: "100%", height: "100%" },
  fallback: { alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  noImage: { fontSize: typeSize.meta, color: colors.muted },
  dots: { position: "absolute", bottom: 10, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.6)" },
  dotOn: { backgroundColor: colors.surface, width: 18 },
})
