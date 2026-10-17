import { Linking, StyleSheet, Text, View } from "react-native"
import { CalendarClock, Video } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { PrimaryButton } from "@/components/primary-button"
import { meetingFromEvents } from "@/lib/booking-meeting"
import { formatWhenZone } from "@/lib/format-date"
import { colors, radius, type as typeSize } from "@/lib/theme"

type Props = {
  order: {
    line: string
    payment_state: string
    fulfillment_state: string
    snapshot: { slotStart?: string; slotEnd?: string; timezone?: string }
    events: { kind: string; message?: string | null; created_at?: string }[]
  }
}

/** Your session: the time in the expert's zone and in yours, the meeting link when the expert has added it, and Join. */
export function BookingSessionCard({ order }: Props) {
  const { t, i18n } = useTranslation("app")
  if (order.line !== "experts" || order.payment_state !== "paid" || order.fulfillment_state === "cancelled" || !order.snapshot.slotStart) return null
  const locale = i18n.resolvedLanguage || i18n.language || "en"
  const zone = order.snapshot.timezone || undefined
  const expertTime = formatWhenZone(order.snapshot.slotStart, locale, zone)
  const myTime = formatWhenZone(order.snapshot.slotStart, locale)
  const meeting = meetingFromEvents(order.events)
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <CalendarClock size={18} color={colors.primaryText} strokeWidth={2.2} />
        </View>
        <Text style={styles.title}>{t("marketplace.session.title", { defaultValue: "Your session" })}</Text>
      </View>
      <Text style={styles.time}>{myTime}</Text>
      {zone && expertTime !== myTime ? <Text style={styles.sub}>{t("marketplace.session.expertTime", { time: expertTime, defaultValue: "Expert's time: {{time}}" })}</Text> : null}
      {meeting.instructions ? <Text style={styles.notes}>{meeting.instructions}</Text> : null}
      {meeting.url ? (
        <PrimaryButton
          label={t("marketplace.session.join", { defaultValue: "Join session" })}
          onPress={() => void Linking.openURL(meeting.url as string)}
        />
      ) : (
        <View style={styles.pending}>
          <Video size={16} color={colors.muted} strokeWidth={2} />
          <Text style={styles.sub}>{t("marketplace.session.noLink", { defaultValue: "The expert will add the meeting link here before your session." })}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { gap: 8, padding: 16, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  icon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryTint },
  title: { fontSize: typeSize.meta, fontWeight: "700", color: colors.text },
  time: { fontSize: typeSize.headline, fontWeight: "700", color: colors.text },
  sub: { flex: 1, fontSize: typeSize.meta, color: colors.muted, lineHeight: 18 },
  notes: { fontSize: typeSize.body, color: colors.text, lineHeight: 22 },
  pending: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
})
