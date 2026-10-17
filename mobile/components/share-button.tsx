import { Platform, Pressable, Share, StyleSheet, type StyleProp, type ViewStyle } from "react-native"
import { Share2 } from "lucide-react-native"
import * as Clipboard from "expo-clipboard"
import { useTranslation } from "react-i18next"
import { useToast } from "@/components/toast-provider"
import { Icon } from "@/components/ui/icon"
import { NAV_ICON, NavAction } from "@/components/ui/nav-bar"
import { colors } from "@/lib/theme"

/** Shares a link: the system share sheet on phones, the browser's share or a copied link on the web. */
export function ShareButton({
  url,
  title,
  style,
  placement = "inline",
}: {
  url: string
  title: string
  style?: StyleProp<ViewStyle>
  /** `bar` is the nav-bar action (44 pt slot, ink glyph). */
  placement?: "inline" | "bar"
}) {
  const { t } = useTranslation("app")
  const { showSuccess } = useToast()
  const onPress = async () => {
    try {
      if (Platform.OS === "web") {
        const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { share?: (d: { title?: string; url: string }) => Promise<void> }) : null
        if (nav?.share) return await nav.share({ title, url })
        await Clipboard.setStringAsync(url)
        showSuccess(t("share.copied", { defaultValue: "Link copied" }))
        return
      }
      await Share.share(Platform.OS === "ios" ? { url, message: title } : { message: `${title}\n${url}` })
    } catch {
      /* the person closed the share sheet */
    }
  }
  if (placement === "bar") {
    return (
      <NavAction label={t("share.aria", { defaultValue: "Share" })} onPress={() => void onPress()}>
        <Icon name="share" size={NAV_ICON} color={colors.text} />
      </NavAction>
    )
  }
  return (
    <Pressable onPress={() => void onPress()} hitSlop={7} accessibilityRole="button" accessibilityLabel={t("share.aria", { defaultValue: "Share" })} style={[styles.chip, style]}>
      <Share2 size={18} strokeWidth={2.2} color={colors.muted} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
})
