import { ActivityIndicator, StyleSheet, View } from "react-native"
import { colors } from "@/lib/theme"

/** Auth restore: flat paper + spinner, no phone frame or sidebar. */
export function SessionRestoreCanvas() {
  return (
    <View style={styles.fill} accessibilityLabel="Restoring session">
      <ActivityIndicator color={colors.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    width: "100%",
    minHeight: "100%",
    backgroundColor: colors.paper,
    justifyContent: "center",
    alignItems: "center",
  },
})
