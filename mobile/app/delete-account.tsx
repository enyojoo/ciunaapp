import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { useAuth } from "@/lib/auth-context"
import { ApiError, authJson } from "@/lib/social-api"
import { useCachedQuery } from "@/lib/use-cached-query"
import { NARROW_COLUMN } from "@/lib/layout-metrics"
import { colors, radius, type as typeSize, ui } from "@/lib/theme"

interface State { blockers: { orders: number; transfers: number; refunds: number }; waitDays: number }

export default function DeleteAccountScreen() {
  const { t } = useTranslation("app")
  const { user, signOut } = useAuth()
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data, error: loadError, revalidate } = useCachedQuery<State>(user ? `ciuna_delete_state_${user.id}` : null, () => authJson<State>("/api/account/delete"), { ttlMs: 0 })

  const b = data?.blockers
  const blocked = Boolean(b && b.orders + b.transfers + b.refunds > 0)
  const days = data?.waitDays ?? 30

  const run = async () => {
    setBusy(true)
    setError(null)
    try {
      await authJson("/api/account/delete", { method: "POST", body: {} })
      setConfirm(false)
      await signOut()
    } catch (e) {
      setConfirm(false)
      if (e instanceof ApiError && e.code === "DELETION_BLOCKED") void revalidate()
      else setError(e instanceof ApiError && e.code === "NETWORK" ? t("deleteAccount.offline") : t("deleteAccount.failed"))
    } finally {
      setBusy(false)
    }
  }

  const items = [
    b && b.orders > 0 ? t("deleteAccount.blockOrders") : null,
    b && b.transfers > 0 ? t("deleteAccount.blockTransfers") : null,
    b && b.refunds > 0 ? t("deleteAccount.blockRefunds") : null,
  ].filter(Boolean) as string[]

  return (
    <ScreenScroll edges={["left", "right", "bottom"]} contentStyle={NARROW_COLUMN}>
      <Text style={ui.title}>{t("deleteAccount.title")}</Text>
      <Text style={[ui.subtitle, styles.lead]}>{t("deleteAccount.lead", { days })}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("deleteAccount.whatHappens")}</Text>
        <Text style={styles.line}>{t("deleteAccount.now")}</Text>
        <Text style={styles.line}>{t("deleteAccount.later", { days })}</Text>
        <Text style={styles.line}>{t("deleteAccount.kept")}</Text>
        <Text style={styles.line}>{t("deleteAccount.restore", { days })}</Text>
      </View>

      {blocked ? (
        <View style={[styles.card, styles.warn]} accessibilityRole="alert">
          <Text style={styles.cardTitle}>{t("deleteAccount.blockedTitle")}</Text>
          {items.map((i) => (
            <Text key={i} style={styles.line}>{i}</Text>
          ))}
        </View>
      ) : null}
      {loadError && !data ? <Text style={styles.err}>{t("deleteAccount.failed")}</Text> : null}
      {error ? <Text style={styles.err} accessibilityRole="alert">{error}</Text> : null}

      <PrimaryButton label={t("deleteAccount.cta")} variant="danger" disabled={blocked || !data} onPress={() => setConfirm(true)} />
      <ConfirmDialog
        open={confirm}
        title={t("deleteAccount.confirmTitle")}
        description={t("deleteAccount.confirmBody", { days })}
        confirmLabel={t("deleteAccount.confirm")}
        cancelLabel={t("deleteAccount.cancel")}
        destructive
        busy={busy}
        onConfirm={() => void run()}
        onCancel={() => setConfirm(false)}
      />
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  lead: { marginTop: 6, marginBottom: 16 },
  card: { marginBottom: 14, padding: 14, gap: 8, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  warn: { backgroundColor: colors.dangerSurface, borderColor: colors.dangerBorder },
  cardTitle: { fontSize: typeSize.meta, fontWeight: "700", color: colors.text },
  line: { fontSize: typeSize.meta, color: colors.text, lineHeight: 20 },
  err: { marginBottom: 12, fontSize: typeSize.meta, fontWeight: "600", color: colors.danger },
})
