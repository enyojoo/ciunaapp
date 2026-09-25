import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { colors, radius, type as typeSize } from "@/lib/theme"

/** Stable pay frame while the YooKassa attempt / widget boots. */
export function OnlinePaySkeleton({
  caption,
}: {
  caption?: string
}) {
  const { t } = useTranslation("app")
  const label =
    caption ||
    t("hub.pay.loading", { defaultValue: "Loading secure payment…" })

  return (
    <View style={styles.frame} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.text}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  frame: {
    minHeight: 280,
    width: "100%",
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderRadius: radius.row,
    backgroundColor: colors.paper,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  text: {
    fontSize: typeSize.meta,
    lineHeight: 20,
    color: colors.muted,
    textAlign: "center",
  },
})
