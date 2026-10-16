import { StyleSheet, Text, View } from "react-native"
import { CheckCircle2, Clock, CreditCard, MapPin, Package, XCircle } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { colors, radius, type as typeSize } from "@/lib/theme"

type OrderLike = {
  fulfillment_state: string
  payment_state: string
  fulfillment_mode: string
  snapshot: { deliveryAddressLine?: string; pickupLocation?: string; pickupHours?: string }
}

const TONE: Record<string, { bg: string; fg: string; Icon: typeof Package }> = {
  awaiting_payment: { bg: "#FFFBEB", fg: "#92400E", Icon: CreditCard },
  awaiting_acceptance: { bg: "#FFFBEB", fg: "#92400E", Icon: Clock },
  accepted: { bg: "#ECFDF5", fg: "#047857", Icon: CheckCircle2 },
  in_progress: { bg: "#FFFBEB", fg: "#92400E", Icon: Package },
  fulfilled: { bg: "#ECFDF5", fg: "#047857", Icon: CheckCircle2 },
  cancelled: { bg: "#F3F4F6", fg: "#4B5563", Icon: XCircle },
}

/** One icon, one status badge and a plain sentence: where this order is right now. */
export function OrderStatusHeader({ order }: { order: OrderLike }) {
  const { t } = useTranslation("app")
  const state = order.fulfillment_state in TONE ? order.fulfillment_state : "awaiting_payment"
  const tone = TONE[state]
  const Icon = tone.Icon
  return (
    <View style={styles.card}>
      <View style={[styles.icon, { backgroundColor: tone.bg }]}>
        <Icon size={22} color={tone.fg} strokeWidth={2.2} />
      </View>
      <View style={styles.body}>
        <View style={[styles.badge, { backgroundColor: tone.bg }]}>
          <Text style={[styles.badgeText, { color: tone.fg }]}>
            {t(`marketplace.${state}`, { defaultValue: state })}
          </Text>
        </View>
        <Text style={styles.line}>{t(`marketplace.statusLine.${state}`, { defaultValue: "" })}</Text>
      </View>
    </View>
  )
}

/** Where it goes (delivery address) or where to collect it (pickup place and hours). */
export function OrderPlaceCard({ order }: { order: OrderLike }) {
  const { t } = useTranslation("app")
  const snap = order.snapshot
  const rows: { key: string; label: string; value: string; Icon: typeof MapPin }[] = []
  if (order.fulfillment_mode === "delivery" && snap.deliveryAddressLine) {
    rows.push({ key: "addr", label: t("marketplace.address", { defaultValue: "Delivery address" }), value: snap.deliveryAddressLine, Icon: MapPin })
  }
  if (order.fulfillment_mode === "pickup") {
    if (snap.pickupLocation) {
      rows.push({ key: "loc", label: t("marketplace.pickupLocation", { defaultValue: "Pickup location" }), value: snap.pickupLocation, Icon: MapPin })
    }
    if (snap.pickupHours) {
      rows.push({ key: "hrs", label: t("marketplace.pickupHours", { defaultValue: "Pickup hours" }), value: snap.pickupHours, Icon: Clock })
    }
  }
  if (!rows.length) return null
  return (
    <View style={styles.place}>
      {rows.map(({ key, label, value, Icon }) => (
        <View key={key} style={styles.row}>
          <View style={styles.rowIcon}>
            <Icon size={16} color={colors.primaryText} strokeWidth={2.2} />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, minWidth: 0, gap: 6, alignItems: "flex-start" },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  line: { fontSize: typeSize.body, lineHeight: 22, color: colors.text },
  place: { gap: 14, padding: 14, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  rowIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryTint, alignItems: "center", justifyContent: "center" },
  rowBody: { flex: 1, minWidth: 0, gap: 2 },
  rowLabel: { fontSize: 12, fontWeight: "600", color: colors.muted },
  rowValue: { fontSize: 15, lineHeight: 21, color: colors.text },
})
