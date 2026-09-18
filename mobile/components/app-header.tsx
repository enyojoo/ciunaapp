import { useRouter } from "expo-router"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { LifeBuoy } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { BrandLogo } from "./brand-logo"
import { colors, radius, space, type as typeSize } from "@/lib/theme"

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
          accessibilityLabel={t("hub.referEarn", { defaultValue: "Refer & earn" })}
        >
          <View style={styles.refer}>
            <Text style={styles.referLabel}>{t("hub.referEarnShort", { defaultValue: "Earn" })}</Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => router.push("/support")}
          accessibilityRole="button"
          accessibilityLabel={t("hub.chatSupport", { defaultValue: "Support" })}
        >
          <View style={styles.support}>
            <LifeBuoy size={22} color={colors.text} strokeWidth={2} />
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
    paddingTop: 4,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 4 },
  refer: {
    minHeight: space.tap,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.refer,
    alignItems: "center",
    justifyContent: "center",
  },
  referLabel: { fontSize: typeSize.meta, fontWeight: "600", color: "#FFFFFF" },
  support: { height: space.tap, width: space.tap, alignItems: "center", justifyContent: "center" },
})
