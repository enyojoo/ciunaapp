import type { ReactNode } from "react"
import { StyleSheet, Text, View } from "react-native"
import { PrimaryButton } from "./primary-button"
import { colors, type as typeSize } from "@/lib/theme"

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
  icon,
}: {
  title: string
  body?: string
  actionLabel?: string
  onAction?: () => void
  /** Design: a tinted icon well above the title (one Lucide icon, 26px). */
  icon?: ReactNode
}) {
  return (
    <View style={styles.wrap}>
      {icon ? <View style={styles.iconWell}>{icon}</View> : null}
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
  iconWell: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.fill, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { textAlign: "center", fontSize: typeSize.headline, lineHeight: 26, fontWeight: "700", color: colors.text },
  body: { marginTop: 8, textAlign: "center", fontSize: typeSize.body, lineHeight: 22, color: colors.muted, maxWidth: 300 },
  action: { marginTop: 24, width: "100%", maxWidth: 280 },
})
