import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Icon } from "@/components/ui/icon"
import { NAV_ICON, NavAction } from "@/components/ui/nav-bar"
import { hubCartItemCount, useHubCartByLine } from "@/lib/hub-cart"
import { hubCartPath } from "@/lib/hub"
import { colors } from "@/lib/theme"

/**
 * The cart in a nav bar: the same 44 pt action as every other bar button, always placed last so it sits in the
 * same spot on the line home, store, product and stores list. An orange dot on the cart means it has items; the exact count is in the label for screen readers and in the cart bar.
 */
export function HubCartHeaderButton({ lineSlug }: { lineSlug: "food" | "mart"; /** @deprecated One look everywhere now. */ variant?: "hero" | "plain" }) {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { cart } = useHubCartByLine(lineSlug)
  const count = hubCartItemCount(cart)
  return (
    <NavAction
      label={`${t("hub.cart.viewCart", { defaultValue: "View cart" })}${count > 0 ? ` (${count})` : ""}`}
      onPress={() => router.push(hubCartPath(lineSlug) as never)}
      dot={count > 0}
    >
      <Icon name="cart" size={NAV_ICON} color={colors.text} />
    </NavAction>
  )
}
