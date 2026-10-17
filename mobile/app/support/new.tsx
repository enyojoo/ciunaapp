import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { AppTextInput } from "@/components/app-text-input"
import { FilterChips } from "@/components/filter-chips"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { supportErrorText } from "@/components/support-status"
import { useAuth } from "@/lib/auth-context"
import { ApiError, authJson } from "@/lib/social-api"
import { useCachedQuery } from "@/lib/use-cached-query"
import { NARROW_COLUMN } from "@/lib/layout-metrics"
import type { CombinedTransaction } from "@/lib/types"
import { colors, radius, type as typeSize } from "@/lib/theme"

const TOPICS = ["order", "payment", "transfer", "account", "booking", "other"] as const
const MAX = 4000

export default function NewSupportRequestScreen() {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { user } = useAuth()
  const params = useLocalSearchParams<{ topic?: string; subject?: string; orderId?: string }>()
  const startTopic = (TOPICS as readonly string[]).includes(String(params.topic)) ? (params.topic as (typeof TOPICS)[number]) : "order"
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>(startTopic)
  const [orderId, setOrderId] = useState(/^[0-9a-f-]{36}$/i.test(String(params.orderId || "")) ? String(params.orderId) : "")
  const [subject, setSubject] = useState(String(params.subject || "").slice(0, 120))
  const [body, setBody] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // The customer's recent marketplace orders, for the "related order" choice.
  const { data: orders } = useCachedQuery<{ id: string; label: string }[]>(
    user ? `ciuna_support_orders_${user.id}` : null,
    async () => {
      const res = await authJson<{ transactions?: CombinedTransaction[] }>("/api/transactions?type=all&limit=20")
      return (res.transactions || [])
        .filter((tx) => tx.marketplace_order?.id)
        .slice(0, 8)
        .map((tx) => ({
          id: String(tx.marketplace_order!.id),
          label: `${String(tx.transaction_id || "").slice(0, 8)} · ${String((tx.hub_snapshot as { productTitle?: string } | null)?.productTitle || tx.marketplace_order!.line)}`,
        }))
    },
    { ttlMs: 120_000 },
  )

  const send = async () => {
    if ([...subject.trim()].length < 3) return setError(t("support.req.err_SUBJECT"))
    if (!body.trim()) return setError(t("support.req.err_EMPTY"))
    setBusy(true)
    setError(null)
    try {
      const res = await authJson<{ id: string }>("/api/support/requests", {
        method: "POST",
        body: { topic, subject: subject.trim(), body: body.trim(), orderId: orderId || undefined },
      })
      router.replace(`/support/${res.id}` as never)
    } catch (e) {
      setError(supportErrorText(t, e instanceof ApiError ? e.code : undefined))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ScreenScroll keyboard edges={["left", "right", "bottom"]} contentStyle={NARROW_COLUMN}>
      <Text style={styles.label}>{t("support.req.topicLabel", { defaultValue: "Topic" })}</Text>
      <FilterChips
        options={TOPICS.map((id) => ({ id, label: t(`support.req.topic_${id}`, { defaultValue: id }) }))}
        value={topic}
        onChange={setTopic}
      />

      {orders && orders.length > 0 ? (
        <>
          <Text style={styles.label}>{t("support.req.relatedOrder", { defaultValue: "Related order (optional)" })}</Text>
          <FilterChips
            options={[{ id: "", label: t("support.req.noOrder", { defaultValue: "None" }) }, ...orders.map((o) => ({ id: o.id, label: o.label }))]}
            value={orderId}
            onChange={setOrderId}
          />
        </>
      ) : null}

      <Text style={styles.label}>{t("support.req.subject", { defaultValue: "Subject" })}</Text>
      <AppTextInput
        value={subject}
        onChangeText={(v) => {
          setSubject(v.slice(0, 120))
          setError(null)
        }}
        placeholder={t("support.req.subjectPlaceholder", { defaultValue: "What do you need help with?" })}
        placeholderTextColor={colors.subtle}
        style={styles.input}
      />

      <Text style={styles.label}>{t("support.req.message", { defaultValue: "Message" })}</Text>
      <AppTextInput
        value={body}
        onChangeText={(v) => {
          setBody(v)
          setError(null)
        }}
        multiline
        style={[styles.input, styles.multiline]}
      />
      <Text style={[styles.counter, [...body].length > MAX && styles.counterOver]}>{`${[...body].length} / ${MAX}`}</Text>

      {error ? (
        <View style={styles.errorBox} accessibilityRole="alert">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      <PrimaryButton label={t("support.req.send", { defaultValue: "Send request" })} busy={busy} disabled={[...body].length > MAX} onPress={() => void send()} />
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  label: { marginTop: 16, marginBottom: 8, fontSize: 13, fontWeight: "700", color: colors.text },
  input: { minHeight: 48, paddingHorizontal: 14, borderRadius: radius.row, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, fontSize: typeSize.body, color: colors.text },
  multiline: { minHeight: 140, paddingTop: 12, textAlignVertical: "top" },
  counter: { marginTop: 4, marginBottom: 12, textAlign: "right", fontSize: 12, color: colors.muted },
  counterOver: { color: colors.danger, fontWeight: "700" },
  errorBox: { marginBottom: 12, padding: 12, borderRadius: radius.row, backgroundColor: colors.dangerSurface },
  errorText: { fontSize: typeSize.meta, fontWeight: "600", color: colors.danger },
})
