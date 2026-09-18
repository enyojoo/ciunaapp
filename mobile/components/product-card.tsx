import { Pressable, StyleSheet, Text, View } from "react-native"
import { Image } from "expo-image"
import { formatMoney, hubProductEffectivePrice, hubProductListPrice, hubProductShowListStrike } from "@/lib/money"
import type { HubProduct } from "@/lib/types"
import { colors, radius, space, type as typeSize } from "@/lib/theme"

export function ProductCard({
  product,
  cta,
  onPress,
}: {
  product: HubProduct
  cta: string
  onPress: () => void
}) {
  const price = hubProductEffectivePrice(product)
  const list = hubProductListPrice(product)
  const strike = hubProductShowListStrike(product)
  const currency = product.fixed_currency || product.default_input_currency || ""
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <View style={styles.card}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.imageFallback} />
        )}
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {product.title}
          </Text>
          {product.vendor?.name ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{product.vendor.name}</Text>
            </View>
          ) : null}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatMoney(price, currency)}</Text>
            {strike && list != null ? <Text style={styles.strike}>{formatMoney(list, currency)}</Text> : null}
          </View>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>{cta}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

export function ProductCardSkeleton() {
  return <View style={[styles.card, styles.skeleton]} />
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    overflow: "hidden",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  skeleton: { minHeight: 280, backgroundColor: colors.paper, borderColor: colors.border },
  image: { width: "100%", aspectRatio: 4 / 3 },
  imageFallback: { width: "100%", aspectRatio: 4 / 3, backgroundColor: colors.paper },
  body: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  chip: {
    marginTop: 6,
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chipText: { fontSize: 12, color: colors.muted },
  priceRow: { marginTop: 8, flexDirection: "row", alignItems: "baseline", gap: 8 },
  price: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  strike: { fontSize: typeSize.meta, color: colors.muted, textDecorationLine: "line-through" },
  cta: {
    marginTop: 12,
    minHeight: space.tap,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.row,
    backgroundColor: colors.primary,
  },
  ctaText: { fontWeight: "600", color: "#FFFFFF" },
})
