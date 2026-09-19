import { StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { statusLabel, statusTone } from "@/lib/transactions"
import { radius } from "@/lib/theme"

const TONE: Record<ReturnType<typeof statusTone>, { bg: string; fg: string }> = {
  pending: { bg: "#FFFBEB", fg: "#92400E" },
  processing: { bg: "#FFFBEB", fg: "#92400E" },
  completed: { bg: "#ECFDF5", fg: "#047857" },
  failed: { bg: "#FEF2F2", fg: "#B91C1C" },
  cancelled: { bg: "#F3F4F6", fg: "#4B5563" },
}

export function StatusChip({ status }: { status?: string | null }) {
  const { t } = useTranslation("app")
  const tone = TONE[statusTone(status)]
  return (
    <View style={[styles.chip, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.fg }]}>{statusLabel(t, status)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  text: { fontSize: 12, fontWeight: "600" },
})
