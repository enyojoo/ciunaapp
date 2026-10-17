import { StyleSheet, Text, View } from "react-native"
import { Check } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { colors, type as typeSize } from "@/lib/theme"

type Props = {
  order: {
    created_at: string
    payment_state: string
    fulfillment_state: string
    events?: { kind: string; created_at: string }[]
  }
}

type Step = { key: string; label: string; state: "done" | "current" | "upcoming" | "stopped" }

/**
 * Customer view of one marketplace order. The API exposes three active fulfilment states
 * (accepted, in_progress, fulfilled), so the seller stages "preparing" and "ready" both show as
 * In progress. Each step shows when it happened, taken from the order's own events (paid, accept, start, fulfill, cancel, refund).
 */
export function OrderTimeline({ order }: Props) {
  const { t, i18n } = useTranslation("app")
  const locale = i18n.resolvedLanguage || i18n.language || "en"
  const label = (key: string, fallback: string) => t(`marketplace.${key}`, { defaultValue: fallback })

  const f = order.fulfillment_state
  const p = order.payment_state
  const cancelled = f === "cancelled"
  const paid = ["paid", "refund_pending", "refunded"].includes(p) || ["accepted", "in_progress", "fulfilled"].includes(f)
  const accepted = ["accepted", "in_progress", "fulfilled"].includes(f)
  const inProgress = ["in_progress", "fulfilled"].includes(f)
  const fulfilled = f === "fulfilled"

  const flags: [string, boolean][] = [
    ["placed", true],
    ["paid", paid],
    ["accepted", accepted],
    ["in_progress", inProgress],
    ["fulfilled", fulfilled],
  ]
  let currentSet = false
  const steps: Step[] = []
  for (const [key, done] of flags) {
    if (cancelled) {
      // Steps after a cancellation never happen; show the ones that did, then a stop.
      if (done) steps.push({ key, label: label(key, key), state: "done" })
      continue
    }
    if (done) {
      steps.push({ key, label: label(key, key), state: "done" })
    } else if (!currentSet) {
      steps.push({ key, label: label(key, key), state: "current" })
      currentSet = true
    } else {
      steps.push({ key, label: label(key, key), state: "upcoming" })
    }
  }
  if (cancelled) steps.push({ key: "cancelled", label: label("cancelled", "Cancelled"), state: "stopped" })
  if (p === "refund_pending" || p === "refunded") {
    steps.push({ key: p, label: label(p, p), state: p === "refunded" ? "done" : "current" })
  }

  const fmt = (iso?: string | null) => {
    const d = iso ? new Date(iso) : null
    return d && !Number.isNaN(d.getTime()) ? d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }) : ""
  }
  // The first time each thing happened (events arrive newest first).
  const at = (...kinds: string[]) => [...(order.events || [])].reverse().find((e) => kinds.includes(e.kind))?.created_at
  const times: Record<string, string> = {
    placed: fmt(order.created_at),
    paid: fmt(at("paid")),
    accepted: fmt(at("accept")),
    in_progress: fmt(at("start")),
    fulfilled: fmt(at("fulfill")),
    cancelled: fmt(at("cancel")),
    refunded: fmt(at("refund")),
  }

  return (
    <View accessibilityRole="list" style={styles.list}>
      {steps.map((s, i) => (
        <View key={s.key} style={styles.row} accessibilityRole="text">
          <View style={styles.rail}>
            <View style={[styles.dot, dotStyle(s.state)]}>
              {s.state === "done" ? <Check size={11} color={colors.onPrimary} strokeWidth={3} /> : null}
            </View>
            {i < steps.length - 1 ? <View style={[styles.line, s.state === "done" && styles.lineDone]} /> : null}
          </View>
          <View style={styles.body}>
            <Text style={[styles.label, s.state === "upcoming" && styles.labelMuted, s.state === "stopped" && styles.labelStop]}>
              {s.label}
            </Text>
            {s.state !== "upcoming" && times[s.key] ? <Text style={styles.time}>{times[s.key]}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  )
}

function dotStyle(state: Step["state"]) {
  if (state === "done") return { backgroundColor: colors.success, borderColor: colors.success }
  if (state === "current") return { backgroundColor: colors.surface, borderColor: colors.primary }
  if (state === "stopped") return { backgroundColor: colors.surface, borderColor: colors.danger }
  return { backgroundColor: colors.surface, borderColor: colors.border }
}

const styles = StyleSheet.create({
  list: { gap: 0 },
  row: { flexDirection: "row", gap: 12, minHeight: 44 },
  rail: { width: 18, alignItems: "center" },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
  lineDone: { backgroundColor: colors.success },
  body: { flex: 1, paddingBottom: 14, gap: 2 },
  label: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  labelMuted: { color: colors.muted, fontWeight: "500" },
  labelStop: { color: colors.danger },
  time: { fontSize: typeSize.meta, color: colors.muted },
})
