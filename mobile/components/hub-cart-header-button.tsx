import { Pressable, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { ShoppingCart } from "lucide-react-native"
import { hubCartItemCount, useHubCartByLine } from "@/lib/hub-cart"
import { hubCartPath } from "@/lib/hub"
import { colors } from "@/lib/theme"

/**
 * Persistent cart entry point — always visible, unlike the floating bar which only shows while
 * actively browsing. Two variants for the two header contexts in this app:
 *  - "hero": the orange gradient hero (Food/Mart line home, vendor storefront) — white icon on a
 *    translucent white chip, matching the existing hero close/back buttons. Has room to spare, so
 *    the badge pokes slightly outside the chip.
 *  - "plain": a native `headerShown: true` bar with a paper/white background (product detail,
 *    eventually cart/checkout). Native header-right content gets less room than the hero and can
 *    clip anything sitting right at its edge, so this variant is smaller overall and keeps the
 *    badge fully inset with clearance on every side instead of overhanging the chip.
 */
export function HubCartHeaderButton({
  lineSlug,
  variant = "hero",
}: {
  lineSlug: "food" | "mart"
  variant?: "hero" | "plain"
}) {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { cart } = useHubCartByLine(lineSlug)
  const count = hubCartItemCount(cart)
  const plain = variant === "plain"

  return (
    <Pressable
      onPress={() => router.push(hubCartPath(lineSlug) as never)}
      accessibilityRole="button"
      accessibilityLabel={t("hub.cart.viewCart", { defaultValue: "View cart" })}
      hitSlop={8}
      style={plain ? styles.hitPlain : styles.hit}
    >
      <View style={plain ? styles.chipPlain : styles.chip}>
        <ShoppingCart size={plain ? 19 : 20} color={plain ? colors.primary : "#FFFFFF"} strokeWidth={2.2} />
        {count > 0 ? (
          <View style={plain ? styles.badgePlain : styles.badge}>
            <Text style={plain ? styles.badgeTextPlain : styles.badgeText}>{count > 9 ? "9+" : count}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  hit: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  chip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 9, fontWeight: "700", color: "#C2410C" },

  // "plain" (native white header): smaller overall, badge fully inset with margin on every side
  // instead of overhanging the chip — the native header-right slot has less room than the hero
  // and clips anything right at the edge of its content.
  hitPlain: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  chipPlain: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  badgePlain: {
    position: "absolute",
    top: 1,
    right: -1,
    minWidth: 13,
    height: 13,
    borderRadius: 6.5,
    paddingHorizontal: 2,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeTextPlain: { fontSize: 8, fontWeight: "700", color: "#FFFFFF" },
})
