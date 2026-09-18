import { type ReactNode } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { ChevronRight } from "lucide-react-native"
import { colors, radius, type as typeSize } from "@/lib/theme"

export function Row({
  label,
  onPress,
  trailing,
  last,
}: {
  label: string
  onPress?: () => void
  trailing?: ReactNode
  last?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.row, !last && styles.border]}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.trail}>
        {trailing}
        {onPress ? <ChevronRight size={18} color={colors.muted} /> : null}
      </View>
    </Pressable>
  )
}

export function GroupCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.heading}>{title}</Text> : null}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  label: { flex: 1, fontSize: typeSize.body, color: colors.text },
  trail: { marginLeft: 8, flexDirection: "row", alignItems: "center", gap: 8 },
  card: {
    marginBottom: 16,
    overflow: "hidden",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
  },
  heading: { paddingTop: 16, fontSize: 17, fontWeight: "600", color: colors.text },
})
