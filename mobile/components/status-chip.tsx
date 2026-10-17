import { StyleSheet, Text, View } from "react-native"
import { Ban, CircleCheck, CircleX, Clock, RefreshCw, Undo2 } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { statusLabel, statusTone } from "@/lib/transactions"
import { radius, colors } from "@/lib/theme"

type Tone = ReturnType<typeof statusTone>

/** Text uses the AA-safe *Text colours and every status carries an icon, so colour is never the only signal. */
const TONE: Record<Tone, { bg: string; fg: string; Icon: typeof Clock }> = {
  pending: { bg: colors.warningSurface, fg: colors.warningText, Icon: Clock },
  processing: { bg: colors.warningSurface, fg: colors.warningText, Icon: RefreshCw },
  completed: { bg: colors.successSurface, fg: colors.successText, Icon: CircleCheck },
  failed: { bg: colors.dangerSurface, fg: colors.dangerText, Icon: CircleX },
  cancelled: { bg: colors.neutralSurface, fg: colors.neutralText, Icon: Ban },
  refunded: { bg: colors.neutralSurface, fg: colors.neutralText, Icon: Undo2 },
}

export function StatusChip({ status }: { status?: string | null }) {
  const { t } = useTranslation("app")
  const tone = TONE[statusTone(status)]
  return (
    <View style={[styles.chip, { backgroundColor: tone.bg }]}>
      <tone.Icon size={12} color={tone.fg} strokeWidth={2.4} />
      <Text style={[styles.text, { color: tone.fg }]}>{statusLabel(t, status)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  text: { fontSize: 12, fontWeight: "600" },
})
