import { StyleSheet, Text, View } from "react-native"
import { colors, radius, type as typeSize } from "@/lib/theme"

const TONE: Record<string, { bg: string; fg: string }> = {
  pending: { bg: "#FFFBEB", fg: "#92400E" },
  processing: { bg: "#FFFBEB", fg: "#92400E" },
  completed: { bg: "#ECFDF5", fg: "#047857" },
  approved: { bg: "#ECFDF5", fg: "#047857" },
  failed: { bg: "#FEF2F2", fg: "#B91C1C" },
  rejected: { bg: "#FEF2F2", fg: "#B91C1C" },
  cancelled: { bg: "#F3F4F6", fg: "#4B5563" },
}

export function StatusChip({ status }: { status?: string | null }) {
  const key = String(status || "").toLowerCase()
  const tone = TONE[key] || { bg: "#F3F4F6", fg: "#374151" }
  const label = status ? status.replace(/_/g, " ") : "—"
  return (
    <View style={[styles.chip, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.fg }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  text: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
})
