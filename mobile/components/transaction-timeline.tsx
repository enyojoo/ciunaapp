import { StyleSheet, Text, View } from "react-native"
import { ArrowRight, ArrowUp, Check } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { formatDateTimeLine, isReferralPayout, isHubTransaction, statusTone } from "@/lib/transactions"
import { colors, type as typeSize } from "@/lib/theme"
import type { CombinedTransaction } from "@/lib/types"

type Stage = {
  id: string
  title: string
  description: string
  icon: typeof ArrowUp
  completed: boolean
  timestamp: string
}

export function TransactionTimeline({ transaction, locale = "en" }: { transaction: CombinedTransaction; locale?: string }) {
  const { t } = useTranslation("app")
  const tone = statusTone(transaction.status)
  const stage2Done = tone === "processing" || tone === "completed"
  const stage3Done = tone === "completed"
  const ts = (v?: string | null) => (v ? formatDateTimeLine(v, locale) : "")

  let stages: Stage[]

  if (isReferralPayout(transaction)) {
    stages = [
      {
        id: "submitted",
        title: t("txTimeline.payoutSubmitted"),
        description: t("txTimeline.payoutSubmittedDesc"),
        icon: ArrowUp,
        completed: true,
        timestamp: ts(transaction.created_at),
      },
      {
        id: "processing",
        title: t("txTimeline.processing"),
        description: t("txTimeline.processingDesc"),
        icon: ArrowRight,
        completed: stage2Done,
        timestamp: stage2Done ? ts(transaction.updated_at) : "",
      },
      {
        id: "sent",
        title: t("txTimeline.payoutSent"),
        description: transaction.recipient?.bank_name
          ? t("txTimeline.payoutSentDescBank", { bank: transaction.recipient.bank_name })
          : t("txTimeline.payoutSentDesc"),
        icon: Check,
        completed: stage3Done,
        timestamp: stage3Done ? ts(transaction.completed_at || transaction.updated_at) : "",
      },
    ]
  } else {
    const isHub = isHubTransaction(transaction)
    stages = [
      {
        id: "initiated",
        title: t("txTimeline.initiated"),
        description: t("txTimeline.initiatedDesc"),
        icon: ArrowUp,
        completed: true,
        timestamp: ts(transaction.created_at),
      },
      {
        id: "processing",
        title: isHub ? t("txTimeline.hubProcessingSend") : t("txTimeline.processingSend"),
        description: isHub ? t("txTimeline.hubProcessingSendDesc") : t("txTimeline.processingSendDesc"),
        icon: ArrowRight,
        completed: stage2Done,
        timestamp: stage2Done ? ts(transaction.updated_at) : "",
      },
      {
        id: "completed",
        title: t("txTimeline.completed"),
        description: isHub
          ? t("txTimeline.hubOrderCompletedDesc")
          : transaction.recipient?.bank_name
            ? t("txTimeline.completedDescBank", { bank: transaction.recipient.bank_name })
            : t("txTimeline.completedDesc"),
        icon: Check,
        completed: stage3Done,
        timestamp: stage3Done ? ts(transaction.completed_at || transaction.updated_at) : "",
      },
    ]
  }

  return (
    <View>
      {stages.map((stage, index) => {
        const Icon = stage.icon
        return (
          <View key={stage.id} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.dot, stage.completed && styles.dotDone]}>
                <Icon size={16} color={stage.completed ? "#fff" : colors.muted} strokeWidth={2.4} />
              </View>
              {index < stages.length - 1 ? <View style={[styles.line, stage.completed && styles.lineDone]} /> : null}
            </View>
            <View style={styles.content}>
              <Text style={[styles.title, stage.completed && styles.titleDone]}>{stage.title}</Text>
              {stage.timestamp ? <Text style={styles.timestamp}>{stage.timestamp}</Text> : null}
              <Text style={[styles.description, stage.completed && styles.descriptionDone]}>{stage.description}</Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 14 },
  rail: { alignItems: "center" },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
  },
  dotDone: { backgroundColor: colors.success },
  line: { width: 2, flex: 1, minHeight: 32, marginTop: 4, backgroundColor: "#E5E7EB" },
  lineDone: { backgroundColor: colors.success },
  content: { flex: 1, paddingBottom: 20, paddingTop: 2 },
  title: { fontSize: typeSize.body, fontWeight: "600", color: colors.muted, marginBottom: 2 },
  titleDone: { color: colors.text },
  timestamp: { fontSize: 12, color: colors.muted, marginBottom: 2 },
  description: { fontSize: typeSize.meta, color: colors.muted },
  descriptionDone: { color: "#374151" },
})
