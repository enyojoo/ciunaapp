import { useRouter } from "expo-router"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { Gift, MessageCircleQuestion } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { BrandLogo } from "./brand-logo"
import { useOptionalResponsiveLayout } from "@/lib/responsive-layout"
import { colors, radius, space } from "@/lib/theme"

/**
 * Home header, as in design-system/components/CustomerHome: logo left, Refer (teal pill) and Support (outline pill)
 * right. No avatar here: the account lives in More. Desktop web uses `DesktopHeader` instead.
 */
export function AppHeader() {
  const router = useRouter()
  const { t } = useTranslation("app")
  const layout = useOptionalResponsiveLayout()
  if (layout?.showSidebarShell) return null
  return (
    <View style={styles.row}>
      <BrandLogo height={28} />
      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push("/referrals")}
          accessibilityRole="button"
          accessibilityLabel={t("dashboard.referEarn", { defaultValue: "Refer" })}
          style={({ pressed }) => [styles.pill, styles.refer, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Gift size={16} color={colors.refer} strokeWidth={2} />
          <Text style={[styles.label, { color: colors.refer }]} numberOfLines={1}>
            {t("dashboard.referShort", { defaultValue: "Refer" })}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/support")}
          accessibilityRole="button"
          accessibilityLabel={t("support.title", { defaultValue: "Support" })}
          style={({ pressed }) => [styles.pill, styles.support, pressed && styles.pressed]}
          hitSlop={8}
        >
          <MessageCircleQuestion size={16} color={colors.text} strokeWidth={2} />
          <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
            {t("support.title", { defaultValue: "Support" })}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.page,
    paddingBottom: 12,
    paddingTop: 8,
    backgroundColor: colors.surface,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 12, flexShrink: 1 },
  pill: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  refer: { backgroundColor: colors.referBg, borderColor: colors.referBorder, maxWidth: 140 },
  support: { backgroundColor: colors.surface, borderColor: colors.border, maxWidth: 140 },
  pressed: { opacity: 0.85 },
  label: { fontSize: 14, fontWeight: "600" },
})
