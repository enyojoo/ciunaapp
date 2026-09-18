import { useRouter } from "expo-router"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BadgeDollarSign, MessageCircle } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { BrandLogo } from "./brand-logo"
import { colors, radius, space } from "@/lib/theme"

/** Web `HubShellHeader`: logo left, Refer & Earn pill + support icon. */
export function AppHeader() {
  const router = useRouter()
  const { t } = useTranslation("app")
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
          onPress={() => router.push("/support")}
          accessibilityRole="button"
          accessibilityLabel={t("dashboard.supportAria", { defaultValue: "Support" })}
          hitSlop={8}
        >
          <View style={styles.support}>
            <MessageCircle size={24} color={colors.supportIcon} strokeWidth={2} />
          </View>
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
  support: {
    height: 40,
    width: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.supportBg,
    alignItems: "center",
    justifyContent: "center",
  },
})
