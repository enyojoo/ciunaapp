import { useEffect, useState } from "react"
import { Pressable, StyleSheet, Switch, Text, View } from "react-native"
import { Minus, Plus } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { GroupCard } from "@/components/row"
import { ScreenScroll } from "@/components/screen"
import { useToast } from "@/components/toast-provider"
import { authJson } from "@/lib/social-api"
import { NARROW_COLUMN } from "@/lib/layout-metrics"
import { colors, type as typeSize, ui } from "@/lib/theme"

const KEYS = ["transfers", "orders", "messages", "support"] as const
type Key = (typeof KEYS)[number]
type Quiet = { enabled: boolean; start: number; end: number }
type Prefs = Record<Key, boolean> & { quiet?: Quiet }
const hour = (h: number) => `${String(h).padStart(2, "0")}:00`
const deviceZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return undefined
  }
}

export default function NotificationsScreen() {
  const { t } = useTranslation("app")
  const { showError } = useToast()
  const [prefs, setPrefs] = useState<Prefs | null>(null)

  useEffect(() => {
    void authJson<Prefs>("/api/push/preferences")
      .then(setPrefs)
      .catch(() => setPrefs({ transfers: true, orders: true, messages: true, support: true }))
  }, [])

  const quiet: Quiet = prefs?.quiet ?? { enabled: false, start: 22, end: 7 }
  const saveQuiet = async (next: Quiet) => {
    const before = prefs
    setPrefs((p) => (p ? { ...p, quiet: next } : p))
    try {
      await authJson("/api/push/preferences", { method: "PUT", body: { quiet: { ...next, tz: deviceZone() } } })
    } catch {
      setPrefs(before)
      showError(t("notifications.failed"))
    }
  }
  const stepHour = (field: "start" | "end", delta: number) => {
    const h = (quiet[field] + delta + 24) % 24
    if (field === "start" ? h === quiet.end : h === quiet.start) return
    void saveQuiet({ ...quiet, enabled: true, [field]: h })
  }

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
              value={prefs ? prefs[k] !== false : true}
              disabled={!prefs}
              onValueChange={(v) => void toggle(k, v)}
              trackColor={{ true: colors.primary, false: colors.inputEdge }}
              thumbColor={colors.surface}
              {...({ activeThumbColor: colors.surface } as object)}
              accessibilityLabel={t(`notifications.${k}`)}
            />
          </View>
        ))}
      </GroupCard>

      <GroupCard>
        <View style={[styles.row, quiet.enabled && styles.rowLine]}>
          <View style={styles.text}>
            <Text style={styles.label}>{t("notifications.quiet")}</Text>
            <Text style={styles.hint}>{t("notifications.quietHint")}</Text>
          </View>
          <Switch
            value={quiet.enabled}
            disabled={!prefs}
            onValueChange={(v) => void saveQuiet({ ...quiet, enabled: v })}
            trackColor={{ true: colors.primary, false: colors.inputEdge }}
            thumbColor={colors.surface}
              {...({ activeThumbColor: colors.surface } as object)}
            accessibilityLabel={t("notifications.quiet")}
          />
        </View>
        {quiet.enabled
          ? (["start", "end"] as const).map((f, i) => (
              <View key={f} style={[styles.row, i === 0 && styles.rowLine]}>
                <Text style={[styles.label, styles.text]}>{t(f === "start" ? "notifications.quietFrom" : "notifications.quietUntil")}</Text>
                <View style={styles.stepper}>
                  <Pressable onPress={() => stepHour(f, -1)} accessibilityRole="button" accessibilityLabel={t("notifications.earlier")} style={styles.stepBtn}>
                    <Minus size={16} color={colors.text} />
                  </Pressable>
                  <Text style={styles.stepValue}>{hour(quiet[f])}</Text>
                  <Pressable onPress={() => stepHour(f, 1)} accessibilityRole="button" accessibilityLabel={t("notifications.later")} style={styles.stepBtn}>
                    <Plus size={16} color={colors.text} />
                  </Pressable>
                </View>
              </View>
            ))
          : null}
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
  stepper: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, borderColor: colors.inputEdge },
  stepBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  stepValue: { width: 64, textAlign: "center", fontSize: typeSize.body, fontWeight: "600", color: colors.text, fontVariant: ["tabular-nums"] },
})
