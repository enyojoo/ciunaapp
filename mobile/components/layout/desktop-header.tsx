import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { BadgeDollarSign, LifeBuoy } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { Avatar } from "@/components/avatar"
import { useAuth } from "@/lib/auth-context"
import { HEADER_HEIGHT } from "@/lib/layout-metrics"
import { colors, radius } from "@/lib/theme"

export function DesktopHeader() {
  const router = useRouter()
  const { t } = useTranslation("app")
  const { profile } = useAuth()
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Account"

  return (
    <View style={styles.header}>
      <View style={styles.spacer} />
      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push("/referrals")}
          accessibilityRole="button"
          accessibilityLabel={t("dashboard.referEarn", { defaultValue: "Refer & Earn" })}
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
          style={styles.iconButton}
          onPress={() => router.push("/support")}
          accessibilityRole="button"
          accessibilityLabel={t("support.title", { defaultValue: "Support" })}
        >
          <LifeBuoy size={20} color={colors.supportIcon} strokeWidth={2} />
        </Pressable>
        <Pressable
          style={styles.avatarButton}
          onPress={() => router.push("/profile")}
          accessibilityRole="button"
          accessibilityLabel={t("dashboard.profileAria", { defaultValue: "Your profile" })}
        >
          <Avatar name={name} size={40} uri={profile?.avatar_url} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    minHeight: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 32,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexShrink: 0,
  },
  spacer: { flex: 1 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
})
