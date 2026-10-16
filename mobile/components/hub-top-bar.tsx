import { type ReactNode } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { SafeAreaView } from "react-native-safe-area-context"
import { goBack, HeroBack, heroBarStyle } from "@/components/hub-line-page-shell"
import { colors, type as typeSize } from "@/lib/theme"

/**
 * The top bar of the hub detail screens (store, product). It is the Food and Mart header bar itself:
 * same white bar and hairline, same bordered back chip, same height, same right-hand action
 * position. A title is optional; the content under it carries the page's own heading.
 */
export function HubTopBar({
  title,
  trailing,
  backHref = "/(app)/hub",
}: {
  title?: string
  trailing?: ReactNode
  backHref?: string
}) {
  const router = useRouter()
  const { t } = useTranslation("app")
  return (
    <View style={heroBarStyle.hero}>
      <SafeAreaView edges={["top"]}>
        <View style={[heroBarStyle.bar, styles.barHeight]}>
          <HeroBack label={t("common.back", { defaultValue: "Back" })} onPress={() => goBack(router, backHref)} />
          <View style={styles.middle}>
            {title ? (
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            ) : null}
          </View>
          {trailing ? <View style={heroBarStyle.trailing}>{trailing}</View> : null}
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  // Food and Mart's bar is this tall (its title block is a touch taller than the back chip), so the chip, cart and hairline line up across screens.
  barHeight: { minHeight: 70 },
  middle: { flex: 1, minWidth: 0 },
  title: { fontSize: typeSize.body, fontWeight: "700", color: colors.text },
})
