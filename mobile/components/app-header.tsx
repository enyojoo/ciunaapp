import { useRouter } from "expo-router"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { Gift } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Avatar } from "./avatar"
import { PressableScale } from "@/components/ui/pressable-scale"
import { BrandLogo } from "./brand-logo"
import { useAuth } from "@/lib/auth-context"
import { useOptionalResponsiveLayout } from "@/lib/responsive-layout"
import { colors, radius, space, type as typeSize } from "@/lib/theme"

/**
 * Home header: logo left; Refer (teal pill) and the profile avatar right, as before. Support is not on Home.
 * Desktop web uses `DesktopHeader` instead.
 */
export function AppHeader() {
  const router = useRouter()
  const { t } = useTranslation("app")
  const { profile } = useAuth()
  const layout = useOptionalResponsiveLayout()
  if (layout?.showSidebarShell) return null
  return (
    <View style={styles.row}>
      <BrandLogo height={28} />
      <View style={styles.actions}>
        {/* Static style: a function style on Pressable is dropped by NativeWind on native, which stacked the icon
            over the label with no pill. */}
        <PressableScale
          onPress={() => router.push("/referrals")}
          haptics
          accessibilityRole="button"
          accessibilityLabel={t("dashboard.referEarn", { defaultValue: "Refer" })}
          style={[styles.pill, styles.refer]}
          hitSlop={8}
        >
          <Gift size={16} color={colors.refer} strokeWidth={2} />
          <Text style={[styles.label, { color: colors.refer }]} numberOfLines={1}>
            {t("dashboard.referShort", { defaultValue: "Refer" })}
          </Text>
        </PressableScale>
        <Pressable
          onPress={() => router.push("/profile")}
          accessibilityRole="button"
          accessibilityLabel={t("dashboard.profileAria", { defaultValue: "Your profile" })}
          hitSlop={8}
          style={styles.avatarRing}
        >
          <Avatar
            name={[profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Account"}
            size={36}
            uri={profile?.avatar_url}
          />
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
    backgroundColor: colors.paper,
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
  label: { fontSize: typeSize.meta, fontWeight: "600" },
  // A white ring with a hairline edge lifts the photo off the paper. Orange is kept for meaning (a dot when the account
  // needs action), not decoration, so it never reads as a "new story" ring.
  avatarRing: { padding: 2, borderRadius: 22, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.inputEdge },
})
