import { StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Check } from "lucide-react-native"
import { LoadError } from "@/components/load-error"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { useAuth } from "@/lib/auth-context"
import { formatCardPrice } from "@/lib/money"
import { authJson } from "@/lib/social-api"
import { useCachedQuery } from "@/lib/use-cached-query"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { NARROW_COLUMN } from "@/lib/layout-metrics"
import { colors, radius, type as typeSize } from "@/lib/theme"

type Level = { level: number; currency: string; monthly_amount: number; min_per_transfer: number | null; max_per_transfer: number | null }
type LimitState = {
  configured: boolean
  level: 1 | 2 | 3
  inReview: boolean
  levels: Level[]
  current: (Level & { used: number; remaining: number; resetsAt: string }) | null
}

/** What the customer can send this month, what is left, when it resets, and how to raise it. Amounts come from Office. */
export default function LimitsScreen() {
  const { t, i18n } = useTranslation("app")
  const router = useRouter()
  const { user } = useAuth()
  const { data, loading, error, revalidate } = useCachedQuery<LimitState>(user ? `ciuna_limits_${user.id}` : null, () => authJson<LimitState>("/api/limits"), { ttlMs: 60_000 })
  useFocusRevalidate(revalidate)

  if (loading && !data) return <View style={styles.skeleton} />
  if (!data) return <LoadError onRetry={() => void revalidate()} />

  const c = data.current
  const money = (n: number, cur: string) => formatCardPrice(n, cur)
  const pct = c ? Math.min(100, Math.round((c.used / c.monthly_amount) * 100)) : 0
  const reached = Boolean(c && c.remaining <= 0)
  const close = Boolean(c && !reached && pct >= 80)
  const tone = reached ? colors.danger : close ? colors.warningText : colors.primary
  const date = c ? new Date(c.resetsAt).toLocaleDateString(i18n.language, { dateStyle: "medium" }) : ""
  const next = data.level < 3 ? (data.level === 1 ? "identity" : "address") : null

  return (
    <ScreenScroll edges={["left", "right", "bottom"]} contentStyle={NARROW_COLUMN}>
      {data.inReview ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{t("limits.inReview", { defaultValue: "Your verification is in review. Your current limit still applies." })}</Text>
        </View>
      ) : null}

      <View style={styles.plate}>
        <Text style={styles.label}>{t("limits.thisMonth", { defaultValue: "This month" })}</Text>
        {c ? (
          <>
            <Text style={[styles.big, reached && { color: colors.danger }]}>{t("limits.left", { amount: money(c.remaining, c.currency), defaultValue: "{{amount}} left" })}</Text>
            <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: pct }}>
              <View style={[styles.fill, { width: `${pct}%`, backgroundColor: tone }]} />
            </View>
            <Text style={styles.meta}>{t("limits.usedOf", { used: money(c.used, c.currency), limit: money(c.monthly_amount, c.currency), defaultValue: "{{used}} of {{limit}} used" })}</Text>
            <Text style={styles.meta}>{t("limits.resets", { date, defaultValue: "Resets {{date}}" })}</Text>
            {reached ? <Text style={[styles.note, { color: colors.danger }]}>{t("limits.reached", { defaultValue: "You have reached this month's limit." })}</Text> : null}
            {close ? <Text style={[styles.note, { color: colors.warningText }]}>{t("limits.close", { defaultValue: "You are close to this month's limit." })}</Text> : null}
            {c.min_per_transfer != null || c.max_per_transfer != null ? (
              <View style={styles.perTransfer}>
                <Text style={styles.label}>{t("limits.perTransfer", { defaultValue: "Per transfer" })}</Text>
                {c.min_per_transfer != null ? <Text style={styles.meta}>{`${t("limits.minimum", { defaultValue: "Minimum" })}: ${money(c.min_per_transfer, c.currency)}`}</Text> : null}
                {c.max_per_transfer != null ? <Text style={styles.meta}>{`${t("limits.maximum", { defaultValue: "Maximum" })}: ${money(c.max_per_transfer, c.currency)}`}</Text> : null}
              </View>
            ) : null}
            <Text style={styles.hint}>{t("limits.currencyNote", { currency: c.currency, defaultValue: "Limits apply to transfers sent in {{currency}}." })}</Text>
          </>
        ) : (
          <Text style={styles.meta}>{t("limits.notSet", { defaultValue: "No sending limit is set for your level right now." })}</Text>
        )}
      </View>

      {data.levels.length > 0 ? (
        <View style={styles.plate}>
          <Text style={styles.label}>{t("limits.levels", { defaultValue: "Levels" })}</Text>
          {[1, 2, 3].map((n) => {
            const row = data.levels.find((l) => l.level === n)
            const mine = n === data.level
            return (
              <View key={n} style={[styles.level, mine && styles.levelMine]}>
                <View style={styles.levelBody}>
                  <Text style={styles.levelName}>{t(`limits.level${n}`, { defaultValue: `Level ${n}` })}</Text>
                  {row ? <Text style={styles.meta}>{t("limits.monthly", { amount: money(row.monthly_amount, row.currency), defaultValue: "{{amount}} a month" })}</Text> : null}
                </View>
                {n < data.level ? <Check size={18} color={colors.success} strokeWidth={2.4} /> : mine ? <Text style={styles.you}>{t("limits.yourLevel", { defaultValue: "Your level" })}</Text> : null}
              </View>
            )
          })}
        </View>
      ) : null}

      {next ? (
        <PrimaryButton
          label={next === "identity" ? t("limits.verifyIdentity", { defaultValue: "Verify identity" }) : t("limits.verifyAddress", { defaultValue: "Verify address" })}
          onPress={() => router.push((next === "identity" ? "/verification/identity" : "/verification/address") as never)}
        />
      ) : (
        <Text style={styles.hint}>{t("limits.highest", { defaultValue: "You are at the highest level. Contact support to change your limit." })}</Text>
      )}
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  skeleton: { margin: 16, height: 240, borderRadius: radius.card, backgroundColor: colors.paper },
  banner: { marginBottom: 12, padding: 12, borderRadius: radius.row, backgroundColor: "#FFFBEB" },
  bannerText: { fontSize: typeSize.meta, fontWeight: "600", color: colors.warningText },
  plate: { marginBottom: 16, padding: 16, gap: 8, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  label: { fontSize: 12, fontWeight: "700", color: colors.muted },
  big: { fontSize: 34, fontWeight: "800", letterSpacing: -0.5, color: colors.text, fontVariant: ["tabular-nums"] },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: "hidden" },
  fill: { height: 8, borderRadius: 4 },
  meta: { fontSize: typeSize.meta, color: colors.muted },
  note: { fontSize: typeSize.meta, fontWeight: "700" },
  perTransfer: { marginTop: 8, paddingTop: 12, gap: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  hint: { marginTop: 4, fontSize: 12, color: colors.muted },
  level: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.row },
  levelMine: { backgroundColor: colors.primaryTint },
  levelBody: { flex: 1, gap: 2 },
  levelName: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  you: { fontSize: 12, fontWeight: "700", color: colors.primaryText },
})
