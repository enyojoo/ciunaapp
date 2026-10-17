import { ScrollView, StyleSheet, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Avatar } from "@/components/avatar"
import { CurrencyFlag } from "@/components/currency-flag"
import { AppText, PressableScale, SectionHeader } from "@/components/ui"
import type { RecipientRow } from "@/lib/types"
import { colors, radius, space } from "@/lib/theme"
import { formatExchangeRateDisplay } from "@ciuna/shared"
import { findRate, type RateRow } from "@/lib/fx"

export type Corridor = { from: string; to: string }

const MAX_RECIPIENTS = 8

/** Pill with the live rate for the user's usual corridor. Opens Send. */
export function RateChip({ corridor, rates }: { corridor: Corridor | null; rates: RateRow[] }) {
  const { t } = useTranslation("app")
  const router = useRouter()
  if (!corridor) return null
  const rate = findRate(rates, corridor.from, corridor.to)
  if (!rate) return null
  const label = `1 ${corridor.from} = ${formatExchangeRateDisplay(Number(rate.rate))} ${corridor.to}`
  return (
    <PressableScale
      onPress={() => router.push(`/send?from=${corridor.from}&to=${corridor.to}` as never)}
      haptics
      accessibilityRole="button"
      accessibilityLabel={t("home.rate.aria", { from: corridor.from, to: corridor.to, defaultValue: "Exchange rate {{from}} to {{to}}. Open Send." })}
      style={styles.rate}
    >
      <CurrencyFlag code={corridor.from} size={16} />
      <AppText variant="label" numeric numberOfLines={1}>
        {label}
      </AppText>
      <CurrencyFlag code={corridor.to} size={16} />
    </PressableScale>
  )
}

/** Recent recipients as a rail. Tapping one opens Send with that person selected. */
export function SendAgainRail({ recipients, corridor }: { recipients: RecipientRow[]; corridor: Corridor | null }) {
  const { t } = useTranslation("app")
  const router = useRouter()
  if (recipients.length === 0 || !corridor) return null
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <SectionHeader title={t("home.sendAgain.title", { defaultValue: "Send again" })} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
        {recipients.slice(0, MAX_RECIPIENTS).map((r) => {
          const to = (r.currency || corridor.to).toUpperCase()
          return (
            <PressableScale
              key={r.id}
              onPress={() => router.push(`/send?from=${corridor.from}&to=${to}&recipient=${r.id}` as never)}
              haptics
              accessibilityRole="button"
              accessibilityLabel={r.full_name}
              style={styles.person}
            >
              <Avatar name={r.full_name} size={56} />
              <AppText variant="meta" numberOfLines={2} style={styles.name}>
                {r.full_name.trim()}
              </AppText>
            </PressableScale>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginTop: space.lg },
  head: { paddingHorizontal: space.gutter },
  rail: { paddingHorizontal: space.gutter, gap: space.lg },
  person: { width: 76, alignItems: "center", gap: 6 },
  name: { textAlign: "center", width: 76 },
  rate: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: 40,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
})
