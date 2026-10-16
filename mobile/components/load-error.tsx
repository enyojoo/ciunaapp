import { StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { PrimaryButton } from "@/components/primary-button"
import { colors, type as typeSize } from "@/lib/theme"

/** A calm "couldn't load" block with a retry. Used wherever a discovery/chat/review call can fail. */
export function LoadError({ onRetry, message }: { onRetry: () => void; message?: string }) {
  const { t } = useTranslation("app")
  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <Text style={styles.text}>{message || t("social.loadFailed", { defaultValue: "Couldn't load, try again" })}</Text>
      <View style={styles.action}>
        <PrimaryButton label={t("social.retry", { defaultValue: "Try again" })} variant="secondary" onPress={onRetry} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: 32, paddingHorizontal: 16 },
  text: { textAlign: "center", fontSize: typeSize.body, color: colors.muted },
  action: { marginTop: 16, width: "100%", maxWidth: 240 },
})
