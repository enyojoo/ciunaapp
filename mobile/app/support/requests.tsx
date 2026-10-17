import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { MessageSquare, Plus } from "lucide-react-native"
import { EmptyState } from "@/components/empty-state"
import { FilterChips } from "@/components/filter-chips"
import { LoadError } from "@/components/load-error"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { SupportStatusBadge, type SupportStatus } from "@/components/support-status"
import { useAuth } from "@/lib/auth-context"
import { authJson } from "@/lib/social-api"
import { useCachedQuery } from "@/lib/use-cached-query"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { NARROW_COLUMN } from "@/lib/layout-metrics"
import { colors, radius, type as typeSize } from "@/lib/theme"

export type SupportRequestRow = {
  id: string
  public_id: string
  topic: string
  subject: string
  status: SupportStatus
  customer_unread: number
  last_message_at: string
  last_message_preview: string | null
}

type Filter = "all" | "open" | "resolved"

export default function SupportRequestsScreen() {
  const { t, i18n } = useTranslation("app")
  const router = useRouter()
  const { user } = useAuth()
  const [filter, setFilter] = useState<Filter>("all")
  const { data, loading, error, revalidate } = useCachedQuery<SupportRequestRow[]>(
    user ? `ciuna_support_requests_${user.id}` : null,
    async () => (await authJson<{ requests: SupportRequestRow[] }>("/api/support/requests")).requests,
    { ttlMs: 60_000 },
  )
  useFocusRevalidate(revalidate)

  const rows = useMemo(
    () => (data || []).filter((r) => filter === "all" || (filter === "resolved" ? r.status === "resolved" : r.status !== "resolved")),
    [data, filter],
  )
  const date = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(i18n.language, { month: "short", day: "numeric" })
    } catch {
      return ""
    }
  }

  return (
    <ScreenScroll edges={["left", "right"]} contentStyle={NARROW_COLUMN}>
      <PrimaryButton label={t("support.req.newRequest", { defaultValue: "New request" })} onPress={() => router.push("/support/new" as never)} />
      <View style={styles.chips}>
        <FilterChips
          options={[
            { id: "all" as Filter, label: t("support.req.all", { defaultValue: "All" }) },
            { id: "open" as Filter, label: t("support.req.open", { defaultValue: "Open" }) },
            { id: "resolved" as Filter, label: t("support.req.resolved", { defaultValue: "Resolved" }) },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </View>

      {loading && !data ? (
        <View>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.row, styles.skeleton]} />
          ))}
        </View>
      ) : error && !data ? (
        <LoadError onRetry={() => void revalidate()} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={26} color={colors.primaryText} strokeWidth={2} />}
          title={t("support.req.empty", { defaultValue: "No requests yet" })}
          body={t("support.req.emptyBody", { defaultValue: "Send us a message and our team will reply here." })}
        />
      ) : (
        rows.map((r) => (
          <Pressable key={r.id} onPress={() => router.push(`/support/${r.id}` as never)} accessibilityRole="button" style={styles.row}>
            <View style={styles.body}>
              <View style={styles.head}>
                <Text style={styles.subject} numberOfLines={1}>
                  {r.subject}
                </Text>
                {r.customer_unread > 0 ? <View style={styles.dot} accessibilityLabel={String(r.customer_unread)} /> : null}
              </View>
              {r.last_message_preview ? (
                <Text style={styles.preview} numberOfLines={1}>
                  {r.last_message_preview}
                </Text>
              ) : null}
              <View style={styles.foot}>
                <SupportStatusBadge status={r.status} />
                <Text style={styles.date}>
                  {r.public_id} · {date(r.last_message_at)}
                </Text>
              </View>
            </View>
          </Pressable>
        ))
      )}
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  chips: { marginTop: 16, marginBottom: 12 },
  row: { marginBottom: 10, padding: 14, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, minHeight: 88 },
  skeleton: { backgroundColor: colors.paper, borderColor: colors.paper },
  body: { gap: 6 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  subject: { flex: 1, fontSize: typeSize.body, fontWeight: "700", color: colors.text },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  preview: { fontSize: typeSize.meta, color: colors.muted },
  foot: { flexDirection: "row", alignItems: "center", gap: 10 },
  date: { fontSize: typeSize.caption, color: colors.muted },
})
