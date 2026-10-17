import { useMemo, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { PrimaryButton } from "@/components/primary-button"
import type { ExpertSlot } from "@/lib/types"
import { haptic } from "@/lib/haptics"
import { colors, radius, type as typeSize } from "@/lib/theme"

type Day = { key: string; date: Date; slots: ExpertSlot[] }

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

/** Short zone name for the device ("MSK", "GMT+3"), shown beside the times. */
function zoneName(locale: string, at: Date, timeZone?: string): string {
  try {
    const part = new Intl.DateTimeFormat(locale, { timeZoneName: "short", ...(timeZone ? { timeZone } : {}) })
      .formatToParts(at)
      .find((p) => p.type === "timeZoneName")
    return part?.value || Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return ""
  }
}

/**
 * Date strip, 3-column time grid and a button that names the chosen time. Times are shown in the
 * customer's own zone. The expert's zone is not in the API yet, so the second zone is not shown.
 */
export function SlotPicker({
  slots,
  loading,
  onConfirm,
  expertZone,
}: {
  slots: ExpertSlot[]
  loading?: boolean
  onConfirm: (slotId: string) => void
  /** IANA zone of the expert. When it differs from the device zone it is named beside the customer's. */
  expertZone?: string | null
}) {
  const { t, i18n } = useTranslation("app")
  const locale = i18n.resolvedLanguage || i18n.language || "en"

  const days = useMemo<Day[]>(() => {
    const map = new Map<string, Day>()
    for (const s of [...slots].sort((a, b) => a.slot_start.localeCompare(b.slot_start))) {
      const d = new Date(s.slot_start)
      if (Number.isNaN(d.getTime())) continue
      const key = dayKey(d)
      const day = map.get(key) || { key, date: d, slots: [] }
      day.slots.push(s)
      map.set(key, day)
    }
    return [...map.values()]
  }, [slots])

  const open = (s: ExpertSlot) => !s.status || s.status === "open"
  const hasOpen = (d: Day) => d.slots.some(open)

  const [dayPick, setDayPick] = useState<string | null>(null)
  const [slotId, setSlotId] = useState<string | null>(null)
  // Land on the first day that still has a free time, not on a fully booked one.
  const firstOpenDay = days.find(hasOpen) || days[0]
  const activeDay = days.find((d) => d.key === dayPick) || firstOpenDay
  const chosen = activeDay?.slots.find((s) => s.id === slotId) || null
  const nextOpenDay = activeDay && !hasOpen(activeDay) ? days.find((d) => d.date > activeDay.date && hasOpen(d)) : undefined
  const openSlots = activeDay ? activeDay.slots.filter(open) : []

  const time = (iso: string) => new Date(iso).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })

  if (loading) {
    return (
      <View style={styles.grid} accessibilityLabel={t("marketplace.loading")}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={[styles.slot, styles.skeleton]} />
        ))}
      </View>
    )
  }
  if (!days.length || !activeDay) {
    return <Text style={styles.empty}>{t("marketplace.noSlots")}</Text>
  }

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {days.map((d) => {
          const on = d.key === activeDay.key
          const full = !hasOpen(d)
          return (
            <Pressable
              key={d.key}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityHint={full ? t("experts.slots.dayFull", { defaultValue: "Full" }) : undefined}
              onPress={() => {
                haptic.selection()
                setDayPick(d.key)
                setSlotId(null)
              }}
              style={[styles.day, full && styles.dayFull, on && styles.dayOn]}
            >
              <Text style={[styles.dayWeek, on && styles.dayTextOn]}>
                {d.date.toLocaleDateString(locale, { weekday: "short" })}
              </Text>
              <Text style={[styles.dayNum, full && styles.dayNumFull, on && styles.dayTextOn]}>{d.date.getDate()}</Text>
              {full ? (
                <Text style={[styles.dayTag, on && styles.dayTextOn]} numberOfLines={1}>
                  {t("experts.slots.dayFull", { defaultValue: "Full" })}
                </Text>
              ) : (
                <View style={[styles.dot, on && styles.dotOn]} />
              )}
            </Pressable>
          )
        })}
      </ScrollView>

      <Text style={styles.dayLabel}>
        {activeDay.date.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" })}
      </Text>
      {openSlots.length > 0 ? (
        // Taken times are left out: a grid of struck-through buttons reads as broken, not as booked.
        <View style={styles.grid}>
          {openSlots.map((s) => {
            const on = s.id === slotId
            return (
              <Pressable
                key={s.id}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => {
                  haptic.selection()
                  setSlotId(s.id)
                }}
                style={[styles.slot, on && styles.slotOn]}
              >
                <Text style={[styles.slotText, on && styles.slotTextOn]}>{time(s.slot_start)}</Text>
              </Pressable>
            )
          })}
        </View>
      ) : (
        <View style={styles.noneLeft}>
          <Text style={styles.empty}>{t("experts.slots.noneLeft", { defaultValue: "No times left on this day." })}</Text>
          {nextOpenDay ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                setDayPick(nextOpenDay.key)
                setSlotId(null)
              }}
            >
              <Text style={styles.jump}>
                {t("experts.slots.jumpNext", {
                  day: nextOpenDay.date.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" }),
                  defaultValue: "Next available: {{day}}",
                })}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}

      <Text style={styles.zone}>
        {t("experts.slots.timezone", { zone: zoneName(locale, new Date(activeDay.date)), defaultValue: "Times shown in your time zone ({{zone}})" })}
        {expertZone && expertZone !== Intl.DateTimeFormat().resolvedOptions().timeZone
          ? " · " +
            t("experts.slots.expertZone", {
              place: expertZone.split("/").pop()?.replace(/_/g, " ") || expertZone,
              zone: zoneName(locale, new Date(activeDay.date), expertZone),
              defaultValue: "Expert in {{place}} ({{zone}})",
            })
          : ""}
      </Text>

      <PrimaryButton
        label={
          chosen
            ? t("experts.slots.book", { time: time(chosen.slot_start), defaultValue: "Book {{time}}" })
            : t("experts.slots.pickTime", { defaultValue: "Choose a time" })
        }
        disabled={!chosen}
        onPress={() => chosen && onConfirm(chosen.id)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  strip: { gap: 8 },
  day: {
    width: 56,
    minHeight: 72,
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  dayOn: { backgroundColor: colors.selected, borderColor: colors.selected },
  dayFull: { backgroundColor: colors.paper },
  dayNumFull: { color: colors.subtle },
  dayTag: { fontSize: typeSize.caption, fontWeight: "600", color: colors.muted },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.success, marginTop: 2 },
  dotOn: { backgroundColor: colors.onSelected },
  dayWeek: { fontSize: typeSize.caption, fontWeight: "600", color: colors.muted },
  dayNum: { fontSize: typeSize.headline, fontWeight: "700", color: colors.text },
  dayTextOn: { color: colors.onSelected },
  dayLabel: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slot: {
    width: "31.5%",
    minHeight: 48,
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  slotOn: { backgroundColor: colors.selected, borderColor: colors.selected },
  slotText: { fontSize: typeSize.body, fontWeight: "600", color: colors.text, fontVariant: ["tabular-nums"] },
  slotTextOn: { color: colors.onSelected },
  skeleton: { backgroundColor: colors.paper, borderColor: colors.paper },
  zone: { fontSize: typeSize.meta, color: colors.muted },
  empty: { fontSize: typeSize.body, color: colors.muted },
  noneLeft: { gap: 8, paddingVertical: 8 },
  jump: { fontSize: typeSize.body, fontWeight: "600", color: colors.primaryText },
})
