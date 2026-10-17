import { StyleSheet, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Avatar } from "@/components/avatar"
import { BrandLogo } from "@/components/brand-logo"
import { AppText, Icon, PressableScale } from "@/components/ui"
import { useAuth } from "@/lib/auth-context"
import { colors, radius, space } from "@/lib/theme"

/** Home header on the paper canvas: logo left, Refer pill and the profile avatar right. */
export function HomeHeader() {
  const router = useRouter()
  const { t } = useTranslation("app")
  const { profile } = useAuth()
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Account"
  return (
    <View style={styles.row}>
      <BrandLogo height={28} />
      <View style={styles.actions}>
        <PressableScale
          onPress={() => router.push("/referrals")}
          haptics
          accessibilityRole="button"
          accessibilityLabel={t("dashboard.referEarn", { defaultValue: "Refer" })}
          hitSlop={8}
          style={styles.refer}
        >
          <Icon name="gift" size={16} color={colors.refer} />
          <AppText variant="label" numberOfLines={1} style={styles.referText}>
            {t("dashboard.referShort", { defaultValue: "Refer" })}
          </AppText>
        </PressableScale>
        <PressableScale
          onPress={() => router.push("/profile")}
          accessibilityRole="button"
          accessibilityLabel={t("dashboard.profileAria", { defaultValue: "Your profile" })}
          hitSlop={8}
        >
          <Avatar name={name} size={36} uri={profile?.avatar_url} />
        </PressableScale>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.gutter, paddingTop: space.sm, paddingBottom: space.md },
  actions: { flexDirection: "row", alignItems: "center", gap: space.md },
  refer: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: colors.referBg,
    borderColor: colors.referBorder,
  },
  referText: { color: colors.refer, flexShrink: 0 },
})
