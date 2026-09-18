import { StyleSheet, Text, View } from "react-native"
import { PrimaryButton } from "./primary-button"
import { colors, type as typeSize } from "@/lib/theme"

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string
  body?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <PrimaryButton label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  )
}

export function ComingSoon({ title }: { title: string }) {
  return <EmptyState title={title} body="This line is on the grid but not an engine yet." />
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingHorizontal: 24, paddingVertical: 64 },
  title: { textAlign: "center", fontSize: 18, fontWeight: "600", color: colors.text },
  body: { marginTop: 8, textAlign: "center", fontSize: typeSize.body, color: colors.muted },
  action: { marginTop: 24, width: "100%", maxWidth: 280 },
})
