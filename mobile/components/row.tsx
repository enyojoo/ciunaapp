import { type ReactNode } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { ChevronRight } from "lucide-react-native"
import { colors, radius, type as typeSize } from "@/lib/theme"

export function Row({
  label,
  icon,
  onPress,
  trailing,
  last,
  danger,
}: {
  label: string
  icon?: ReactNode
  onPress?: () => void
  trailing?: ReactNode
  last?: boolean
  danger?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.row, !last && styles.border]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.label, danger && styles.labelDanger]} numberOfLines={1}>
        {label}
      </Text>
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
  icon: {
    width: 30,
    height: 30,
    marginRight: 12,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.heroBody,
  },
  label: { flex: 1, fontSize: typeSize.body, color: colors.text },
  labelDanger: { color: colors.danger },
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
