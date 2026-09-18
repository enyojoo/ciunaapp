import { ScrollView, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { ProductCard } from "@/components/product-card"
import type { HubProduct } from "@/lib/types"
import { colors } from "@/lib/theme"

const CARD_WIDTH = 152
/** Matches `ScreenScroll`'s content `paddingHorizontal` (screen.tsx) — cancelled below so the rail itself can run edge-to-edge, then re-applied inside the rail's own scroll content so cards still line up with the rest of the page. */
const PAGE_INSET = 24

/** Horizontal, slide-left-to-right rail — used for "More from {vendor}" on the product detail screen. Breaks out of the page's side padding so it runs full device width, unlike the rest of the page's content. */
export function HubRecommendedProducts({
  heading,
  products,
  cartLineSlug,
  onProductPress,
}: {
  heading: string
  products: HubProduct[]
  cartLineSlug?: "food" | "mart"
  onProductPress: (product: HubProduct) => void
}) {
  const { t } = useTranslation("app")
  if (!products.length) return null
  const buy = t("hub.buy", { defaultValue: "Buy" })
  const order = t("hub.order", { defaultValue: "Order" })

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading} numberOfLines={1}>
        {heading}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            cta={p.pricing_type === "user_input" ? order : buy}
            showVendor={false}
            onPress={() => onProductPress(p)}
            cartLineSlug={cartLineSlug}
            style={styles.card}
          />
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginTop: 32, marginHorizontal: -PAGE_INSET },
  heading: { fontSize: 18, fontWeight: "600", color: colors.text, marginBottom: 16, paddingHorizontal: PAGE_INSET },
  row: { gap: 12, paddingHorizontal: PAGE_INSET },
  card: { width: CARD_WIDTH },
})
