import { type ReactNode } from "react"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { goBack } from "@/components/hub-line-page-shell"
import { View } from "react-native"
import { NavBar } from "@/components/ui/nav-bar"
import { colors, space } from "@/lib/theme"

/**
 * The top bar of the hub detail screens (store, product, cart, checkout, expert). It is the shared `NavBar`: 44 pt,
 * plain back chevron, optional centred title, actions on the right. `overlay` floats it over a cover photo.
 */
export function HubTopBar({
  title,
  trailing,
  backHref = "/(app)/hub",
  variant = "default",
}: {
  title?: string
  trailing?: ReactNode
  backHref?: string
  variant?: "default" | "overlay"
}) {
  const router = useRouter()
  const { t } = useTranslation("app")
  const bar = (
    <NavBar
      title={title}
      trailing={trailing}
      variant={variant}
      floating={variant === "overlay"}
      backLabel={t("common.back", { defaultValue: "Back" })}
      onBack={() => goBack(router, backHref)}
    />
  )
  if (variant === "overlay") return bar
  // A little canvas under the bar so screens need no top padding of their own.
  return (
    <View style={{ backgroundColor: colors.paper, paddingBottom: space.sm }}>
      {bar}
    </View>
  )
}
