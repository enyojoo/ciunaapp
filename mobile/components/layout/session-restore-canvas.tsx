import { ActivityIndicator, StyleSheet, View } from "react-native"
import { colors } from "@/lib/theme"

/** Same idea as Easner `AuthFlowLoadingShell`: one paper canvas, no phone frame or sidebar. */
export function SessionRestoreCanvas() {
  return (
    <View style={styles.fill} accessibilityLabel="Restoring session">
      <ActivityIndicator color={colors.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.paper,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
})
