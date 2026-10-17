import { useEffect, useState } from "react"
import { StyleSheet, Switch, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { GroupCard } from "@/components/row"
import { ScreenScroll } from "@/components/screen"
import { useToast } from "@/components/toast-provider"
import { authJson } from "@/lib/social-api"
import { NARROW_COLUMN } from "@/lib/layout-metrics"
import { colors, type as typeSize, ui } from "@/lib/theme"

const KEYS = ["orders", "messages", "support"] as const
type Key = (typeof KEYS)[number]

export default function NotificationsScreen() {
  const { t } = useTranslation("app")
  const { showError } = useToast()
  const [prefs, setPrefs] = useState<Record<Key, boolean> | null>(null)

  useEffect(() => {
    void authJson<Record<Key, boolean>>("/api/push/preferences")
      .then(setPrefs)
      .catch(() => setPrefs({ orders: true, messages: true, support: true }))
  }, [])

  const toggle = async (k: Key, v: boolean) => {
    const before = prefs
    setPrefs((p) => (p ? { ...p, [k]: v } : p))
    try {
      await authJson("/api/push/preferences", { method: "PUT", body: { [k]: v } })
    } catch {
      setPrefs(before)
      showError(t("notifications.failed"))
    }
  }

  return (
    <ScreenScroll edges={["left", "right", "bottom"]} contentStyle={NARROW_COLUMN}>
      <Text style={ui.title}>{t("notifications.title")}</Text>
      <Text style={[ui.subtitle, styles.lead]}>{t("notifications.lead")}</Text>
      <GroupCard>
        {KEYS.map((k, i) => (
          <View key={k} style={[styles.row, i < KEYS.length - 1 && styles.rowLine]}>
            <View style={styles.text}>
              <Text style={styles.label}>{t(`notifications.${k}`)}</Text>
              <Text style={styles.hint}>{t(`notifications.${k}Hint`)}</Text>
            </View>
            <Switch
              value={prefs ? prefs[k] : true}
              disabled={!prefs}
              onValueChange={(v) => void toggle(k, v)}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#FFFFFF"
              accessibilityLabel={t(`notifications.${k}`)}
            />
          </View>
        ))}
      </GroupCard>
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  lead: { marginTop: 6, marginBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, paddingHorizontal: 14, paddingVertical: 10 },
  rowLine: { borderBottomWidth: 1, borderBottomColor: colors.border },
  text: { flex: 1 },
  label: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  hint: { marginTop: 2, fontSize: typeSize.meta, color: colors.muted },
})
