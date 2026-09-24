import { StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { colors, type as typeSize } from "@/lib/theme"

export type SendFlowStep = "amount" | "recipient" | "pay"

const ORDER: SendFlowStep[] = ["amount", "recipient", "pay"]

export function SendStepProgress({ step }: { step: SendFlowStep }) {
  const { t } = useTranslation("app")
  const idx = ORDER.indexOf(step)
  const labels: Record<SendFlowStep, string> = {
    amount: t("send.steps.amount", { defaultValue: "Amount" }),
    recipient: t("send.steps.recipient", { defaultValue: "Recipient" }),
    pay: t("send.steps.review", { defaultValue: "Review" }),
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.bars}>
        {ORDER.map((s, i) => (
          <View key={s} style={[styles.bar, i <= idx ? styles.barActive : styles.barIdle]} />
        ))}
      </View>
      <Text style={styles.caption}>{labels[step]}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 20, gap: 8 },
  bars: { flexDirection: "row", gap: 6 },
  bar: { flex: 1, height: 4, borderRadius: 999 },
  barActive: { backgroundColor: colors.primary },
  barIdle: { backgroundColor: colors.border },
  caption: { fontSize: typeSize.meta, fontWeight: "600", color: colors.muted },
})
