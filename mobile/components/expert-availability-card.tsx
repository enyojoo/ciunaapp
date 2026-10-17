import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Bell, BellOff, CalendarClock } from "lucide-react-native"
import { PrimaryButton } from "@/components/primary-button"
import { useToast } from "@/components/toast-provider"
import { useAuth } from "@/lib/auth-context"
import { ApiError, authJson } from "@/lib/social-api"
import { useCachedQuery } from "@/lib/use-cached-query"
import { colors, radius, type as typeSize } from "@/lib/theme"

type Availability = { nextAvailableAt: string | null; alerting: boolean }

/** When the expert is next bookable, or "No open times" with Notify me (one push when times appear). */
export function ExpertAvailabilityCard({ slug }: { slug: string }) {
  const { t, i18n } = useTranslation("app")
  const { user } = useAuth()
  const { showError } = useToast()
  const [busy, setBusy] = useState(false)
  const { data, revalidate } = useCachedQuery<Availability>(user ? `ciuna_expert_avail_${slug}` : null, () => authJson<Availability>(`/api/expert/profiles/${encodeURIComponent(slug)}/availability`), { ttlMs: 30_000 })
  if (!data) return null

  if (data.nextAvailableAt) {
    const when = new Date(data.nextAvailableAt).toLocaleString(i18n.language, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" })
    return (
      <View style={styles.card}>
        <CalendarClock size={18} color={colors.primaryText} strokeWidth={2.2} />
        <Text style={styles.text}>{t("experts.profile.nextAvailable", { when, defaultValue: "Next available: {{when}}" })}</Text>
      </View>
    )
  }

  const toggle = async () => {
    setBusy(true)
    try {
      await authJson(`/api/expert/profiles/${encodeURIComponent(slug)}/availability`, { method: data.alerting ? "DELETE" : "POST", body: {} })
      await revalidate()
    } catch (e) {
      showError(e instanceof ApiError && e.code === "NETWORK" ? t("deleteAccount.offline") : t("experts.profile.notifyFailed", { defaultValue: "Could not save that. Try again." }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={[styles.card, styles.column]}>
      <View style={styles.row}>
        {data.alerting ? <Bell size={18} color={colors.successText} strokeWidth={2.2} /> : <BellOff size={18} color={colors.muted} strokeWidth={2.2} />}
        <View style={styles.flex}>
          <Text style={styles.title}>{t("experts.profile.noTimes", { defaultValue: "No open times right now" })}</Text>
          <Text style={styles.text}>{data.alerting ? t("experts.profile.notifyOn", { defaultValue: "We will tell you as soon as times open." }) : t("experts.profile.notifyHint", { defaultValue: "Get a notification when this expert opens new times." })}</Text>
        </View>
      </View>
      <PrimaryButton label={data.alerting ? t("experts.profile.notifyCancel", { defaultValue: "Stop notifying me" }) : t("experts.profile.notifyMe", { defaultValue: "Notify me" })} variant={data.alerting ? "secondary" : "primary"} busy={busy} onPress={() => void toggle()} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, marginBottom: 16, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  column: { flexDirection: "column", alignItems: "stretch" },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  flex: { flex: 1, minWidth: 0 },
  title: { fontSize: typeSize.body, fontWeight: "700", color: colors.text },
  text: { flex: 1, fontSize: typeSize.meta, color: colors.muted, lineHeight: 18 },
})
