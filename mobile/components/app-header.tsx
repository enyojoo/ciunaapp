import { useRouter } from "expo-router"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BadgeDollarSign } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Avatar } from "./avatar"
import { BrandLogo } from "./brand-logo"
import { useAuth } from "@/lib/auth-context"
import { colors, radius, space } from "@/lib/theme"

/** Web `HubShellHeader`: logo left, Refer & Earn pill + profile avatar. */
export function AppHeader() {
  const router = useRouter()
  const { t } = useTranslation("app")
  const { profile } = useAuth()
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Account"
  return (
    <View style={styles.row}>
      <BrandLogo height={28} />
      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push("/referrals")}
          accessibilityRole="button"
          accessibilityLabel={t("dashboard.referEarn", { defaultValue: "Refer & Earn" })}
          hitSlop={8}
        >
          <LinearGradient
            colors={[colors.referBg, colors.referBgEnd]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.refer}
          >
            <BadgeDollarSign size={14} color={colors.referIcon} strokeWidth={2.25} />
            <Text style={styles.referLabel} numberOfLines={1}>
              {t("dashboard.referEarn", { defaultValue: "Refer & Earn" })}
            </Text>
          </LinearGradient>
        </Pressable>
        <Pressable
          onPress={() => router.push("/profile")}
          accessibilityRole="button"
          accessibilityLabel={t("dashboard.profileAria", { defaultValue: "Your profile" })}
          hitSlop={8}
        >
          <Avatar name={name} size={40} uri={profile?.avatar_url} />
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
  actions: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 12, flexShrink: 1 },
  refer: {
    height: 32,
    maxWidth: 180,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.referBorder,
  },
  referLabel: { fontSize: 12, fontWeight: "600", color: colors.referText },
})
