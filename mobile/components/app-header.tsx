import { useRouter } from "expo-router"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { LifeBuoy } from "lucide-react-native"
import { BrandLogo } from "./brand-logo"
import { colors, radius, type as typeSize } from "@/lib/theme"

export function AppHeader() {
  const router = useRouter()
  return (
    <View style={styles.row}>
      <BrandLogo height={28} />
      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push("/referrals")}
          style={styles.refer}
          accessibilityRole="button"
          accessibilityLabel="Refer"
        >
          <Text style={styles.referLabel}>Refer</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/support")}
          style={styles.support}
          accessibilityRole="button"
          accessibilityLabel="Support"
        >
          <LifeBuoy size={22} color={colors.text} />
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
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 4,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  refer: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.refer,
    alignItems: "center",
    justifyContent: "center",
  },
  referLabel: { fontSize: typeSize.meta, fontWeight: "600", color: "#FFFFFF" },
  support: { height: 44, width: 44, alignItems: "center", justifyContent: "center" },
})
