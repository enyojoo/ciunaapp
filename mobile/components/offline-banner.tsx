import { StyleSheet, Text, View } from "react-native"
import { WifiOff } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useOffline } from "@/lib/network-status"
import { colors, radius, type as typeSize } from "@/lib/theme"

/** A small pill above the tab bar while the app cannot reach the network. It never blocks or shifts the layout. */
export function OfflineBanner() {
  const offline = useOffline()
  const { t } = useTranslation("app")
  const insets = useSafeAreaInsets()
  if (!offline) return null
  return (
    <View pointerEvents="none" style={[styles.wrap, { bottom: insets.bottom + 88 }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <View style={styles.pill}>
        <WifiOff size={14} color={colors.warningText} strokeWidth={2.2} />
        <Text style={styles.text}>{t("offline.banner", { defaultValue: "You are offline. Showing saved data." })}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 50 },
  pill: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.warningSurface, borderWidth: 1, borderColor: colors.warningBorder },
  text: { fontSize: typeSize.meta, fontWeight: "600", color: colors.warningText },
})
