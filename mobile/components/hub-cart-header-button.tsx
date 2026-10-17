import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Icon } from "@/components/ui/icon"
import { NAV_ICON, NavAction } from "@/components/ui/nav-bar"
import { hubCartItemCount, useHubCartByLine } from "@/lib/hub-cart"
import { hubCartPath } from "@/lib/hub"
import { colors } from "@/lib/theme"

/**
 * The cart in a nav bar: the same 44 pt action as every other bar button, always placed last so it sits in the
 * same spot on the line home, store, product and stores list. The count shows on an orange badge.
 */
export function HubCartHeaderButton({ lineSlug }: { lineSlug: "food" | "mart"; /** @deprecated One look everywhere now. */ variant?: "hero" | "plain" }) {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { cart } = useHubCartByLine(lineSlug)
  const count = hubCartItemCount(cart)
  return (
    <NavAction label={t("hub.cart.viewCart", { defaultValue: "View cart" })} onPress={() => router.push(hubCartPath(lineSlug) as never)} badge={count}>
      <Icon name="cart" size={NAV_ICON} color={colors.text} />
    </NavAction>
  )
}
