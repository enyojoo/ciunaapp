import type { ReactNode } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { ChevronRight, Search } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { AppTextInput } from "@/components/app-text-input"
import { EmptyState } from "@/components/empty-state"
import { LoadError } from "@/components/load-error"
import { PrimaryButton } from "@/components/primary-button"
import { StatusChip } from "@/components/status-chip"
import { formatMoney } from "@/lib/money"
import { isReferralPayout, type FilterChip } from "@/lib/transactions"
import { colors, radius, type as typeSize } from "@/lib/theme"
import type { CombinedTransaction } from "@/lib/types"

type Group = { heading: string; rows: CombinedTransaction[] }

type Props = {
  chips: { id: FilterChip; label: string }[]
  chip: FilterChip
  onChip: (c: FilterChip) => void
  query: string
  onQuery: (q: string) => void
  groups: Group[]
  total: number
  loading: boolean
  error: boolean
  offline: boolean
  volume: string
  completed: number
  locale: string
  onRetry: () => void
  onOpen: (tx: CombinedTransaction) => void
  onSupport: () => void
  onClear: () => void
  nameOf: (tx: CombinedTransaction) => string
  lineOf: (tx: CombinedTransaction) => string
  icon: (tx: CombinedTransaction) => ReactNode
  unread: (tx: CombinedTransaction) => boolean
}

/** Desktop Orders (design card CustomerActivityWeb): title and search, filter chips, a table grouped by day, and a totals aside. */
export function OrdersDesktop(p: Props) {
  const { t } = useTranslation("app")
  const time = (iso: string) => new Date(iso).toLocaleTimeString(p.locale, { hour: "numeric", minute: "2-digit" })
  const first = p.total === 0
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
      <View style={styles.head}>
        <Text style={styles.title} accessibilityRole="header">
          {t("transactions.title", { defaultValue: "Activities" })}
        </Text>
        <View style={styles.search}>
          <Search size={18} color={colors.muted} />
          <AppTextInput
            value={p.query}
            onChangeText={p.onQuery}
            placeholder={t("orders.searchPlaceholder", { defaultValue: "Search orders..." })}
            placeholderTextColor={colors.subtle}
            style={styles.searchInput}
          />
        </View>
      </View>
      <View style={styles.cols}>
        <View style={styles.main}>
          <View style={styles.chips}>
            {p.chips.map((c) => {
              const active = p.chip === c.id
              return (
                <Pressable key={c.id} onPress={() => p.onChip(c.id)} style={[styles.chip, active && styles.chipActive]} accessibilityRole="button" accessibilityState={{ selected: active }}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(c.label)}</Text>
                </Pressable>
              )
            })}
          </View>

          {p.loading && first ? [0, 1, 2, 3, 4].map((i) => <View key={i} style={[styles.row, styles.skeleton]} />) : null}
          {!p.loading && p.error && first ? <LoadError onRetry={p.onRetry} /> : null}
          {!p.loading && p.error && !first ? <Text style={styles.offline}>{t("transactions.offline", { defaultValue: "Showing your saved orders. Reload when you are back online." })}</Text> : null}
          {!p.loading && !p.error && first ? (
            <EmptyState title={t("transactions.empty", { defaultValue: "No orders found" })} body={t("transactions.emptyHint", { defaultValue: "Start by sending your first transfer" })} />
          ) : null}
          {!p.loading && !first && p.groups.length === 0 ? (
            <View>
              <EmptyState title={t("transactions.noSearchResults", { defaultValue: "No orders match your search" })} body={t("transactions.adjustSearch", { defaultValue: "Try adjusting your search terms" })} />
              <View style={styles.clear}>
                <PrimaryButton label={t("orders.clearSearch", { defaultValue: "Clear search" })} variant="secondary" onPress={p.onClear} />
              </View>
            </View>
          ) : null}

          {p.groups.length > 0 ? (
            <View style={styles.thead}>
              <Text style={[styles.th, styles.cName]}>{t("orders.colOrder", { defaultValue: "Order" })}</Text>
              <Text style={[styles.th, styles.cDate]}>{t("orders.colDate", { defaultValue: "Time" })}</Text>
              <Text style={[styles.th, styles.cStatus]}>{t("orders.colStatus", { defaultValue: "Status" })}</Text>
              <Text style={[styles.th, styles.cAmount]}>{t("orders.colAmount", { defaultValue: "Amount" })}</Text>
              <View style={styles.cChev} />
            </View>
          ) : null}
          {p.groups.map((g) => (
            <View key={g.heading}>
              <Text style={styles.groupHeading}>{g.heading}</Text>
              <View style={styles.table}>
                {g.rows.map((tx) => {
                  const amount = isReferralPayout(tx) ? tx.send_amount : (tx.send_amount ?? tx.total_amount)
                  return (
                    <Pressable key={tx.transaction_id || tx.id} onPress={() => p.onOpen(tx)} style={({ hovered }: { hovered?: boolean }) => [styles.row, hovered && styles.rowHover]} accessibilityRole="link">
                      <View style={styles.icon}>{p.icon(tx)}</View>
                      <View style={styles.cName}>
                        <Text style={styles.name} numberOfLines={1}>{p.nameOf(tx)}</Text>
                        <Text style={styles.sub} numberOfLines={1}>{p.lineOf(tx)}</Text>
                      </View>
                      <Text style={[styles.date, styles.cDate]}>{time(tx.created_at || "")}</Text>
                      <View style={[styles.cStatus, styles.statusCell]}>
                        {p.unread(tx) ? <View style={styles.dot} accessibilityLabel={t("chat.unreadDot", { defaultValue: "New message from the seller" })} /> : null}
                        <StatusChip status={tx.status} />
                      </View>
                      <Text style={[styles.amount, styles.cAmount, isReferralPayout(tx) && styles.amountIn]} numberOfLines={1}>
                        {isReferralPayout(tx) ? "+" : "−"}
                        {formatMoney(amount, tx.send_currency)}
                      </Text>
                      <View style={styles.cChev}>
                        <ChevronRight size={18} color={colors.subtle} />
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.aside}>
          <View style={styles.plate}>
            <Text style={styles.plateLabel}>{t("orders.totalVolume")}</Text>
            <Text style={styles.plateValue} numberOfLines={1}>{p.volume}</Text>
          </View>
          <View style={styles.plate}>
            <Text style={styles.plateLabel}>{t("orders.totalTransactions")}</Text>
            <Text style={styles.plateValue}>{p.completed}</Text>
          </View>
          <View style={styles.plate}>
            <Text style={styles.helpTitle}>{t("orders.helpTitle", { defaultValue: "Need help with an order?" })}</Text>
            <Text style={styles.plateLabel}>{t("orders.helpBody", { defaultValue: "Message the seller from the order, or ask Ciuna support." })}</Text>
            <View style={styles.helpBtn}>
              <PrimaryButton label={t("marketplace.support", { defaultValue: "Contact support" })} variant="secondary" onPress={p.onSupport} />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  page: { width: "100%", maxWidth: 1140, alignSelf: "center", paddingHorizontal: 32, paddingTop: 28, paddingBottom: 48 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 24, marginBottom: 18 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: "700", color: colors.text, letterSpacing: -0.4 },
  search: { width: 340, minHeight: 44, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, borderRadius: radius.row, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  searchInput: { flex: 1, fontSize: typeSize.body, color: colors.text, paddingVertical: 10 },
  cols: { flexDirection: "row", alignItems: "flex-start", gap: 24 },
  main: { flex: 1, minWidth: 0 },
  aside: { width: 280, gap: 14 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  chip: { minHeight: 34, justifyContent: "center", borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.muted },
  chipTextActive: { color: colors.onPrimary },
  thead: { flexDirection: "row", alignItems: "center", height: 36, paddingHorizontal: 16, columnGap: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  th: { fontSize: 12, fontWeight: "600", letterSpacing: 0.6, textTransform: "uppercase", color: colors.muted },
  groupHeading: { paddingTop: 16, paddingBottom: 8, paddingHorizontal: 16, fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: colors.muted },
  table: { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  row: { minHeight: 68, flexDirection: "row", alignItems: "center", columnGap: 14, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowHover: { backgroundColor: colors.paper },
  skeleton: { backgroundColor: colors.paper, borderColor: colors.paper },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper },
  cName: { flex: 1, minWidth: 0 },
  cDate: { width: 80 },
  cStatus: { width: 116 },
  cAmount: { width: 100, textAlign: "right" },
  cChev: { width: 20, alignItems: "flex-end" },
  name: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  sub: { marginTop: 2, fontSize: 13, color: colors.muted },
  date: { fontSize: 14, color: colors.muted },
  statusCell: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  amount: { fontSize: typeSize.body, fontWeight: "700", color: colors.text, fontVariant: ["tabular-nums"] },
  amountIn: { color: colors.success },
  offline: { fontSize: 12, color: colors.muted, marginBottom: 8 },
  clear: { alignItems: "center", paddingBottom: 24 },
  plate: { padding: 16, gap: 4, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  plateLabel: { fontSize: 13, color: colors.muted },
  plateValue: { fontSize: 24, lineHeight: 30, fontWeight: "700", color: colors.text, fontVariant: ["tabular-nums"] },
  helpTitle: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  helpBtn: { marginTop: 8 },
})
