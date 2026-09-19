import { StyleSheet, View } from "react-native"
import { BrandLogo } from "@/components/brand-logo"
import { HEADER_HEIGHT } from "@/lib/layout-metrics"
import { colors } from "@/lib/theme"

export function SidebarBrandHeader() {
  return (
    <View style={styles.header}>
      <BrandLogo height={32} />
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    minHeight: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
})
