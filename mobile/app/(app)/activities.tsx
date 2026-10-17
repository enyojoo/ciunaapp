import { useMemo, useState } from "react"
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { AppTextInput } from "@/components/app-text-input"
import { useInputFocusRing } from "@/lib/focused-input-box"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react-native"
import { resolveTransactionListLine, transactionListLineIconKind } from "@ciuna/shared"
import { EmptyState } from "@/components/empty-state"
import { LoadError } from "@/components/load-error"
import { Screen } from "@/components/screen"
import { StatusChip } from "@/components/status-chip"
import { fetchWithAuth } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { formatMoney } from "@/lib/money"
import {
  type FilterChip,
  formatDateTimeLine,
  groupByDay,
  isReferralPayout,
  matchesFilterChip,
  matchesSearch,
  transactionTitle as counterparty,
} from "@/lib/transactions"
import { useCachedQuery } from "@/lib/use-cached-query"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useTabContentPadding } from "@/lib/use-tab-content-padding"
import { useRevalidateOnForeground } from "@/lib/use-revalidate-on-foreground"
import { TX_TTL_MS, useTransactions } from "@/lib/use-transactions"
import { useChatUnread } from "@/lib/order-chat"
import { OrdersDesktop } from "@/components/activity-desktop"
import { useResponsiveLayout } from "@/lib/responsive-layout"
import { colors, radius, space, textStyles, type as typeSize } from "@/lib/theme"
import type { CombinedTransaction } from "@/lib/types"

type Volume = { amount: number; currency: string }

async function fetchVolume(): Promise<Volume | null> {
  const res = await fetchWithAuth("/api/user/completed-volume")
  if (!res.ok) throw new Error("Failed to load completed volume")
  const data = (await res.json()) as { volume?: number; baseCurrency?: string }
  if (data.volume == null || !data.baseCurrency) return null
  return { amount: data.volume, currency: data.baseCurrency }
}

function RowIcon({ tx }: { tx: CombinedTransaction }) {
  const line = resolveTransactionListLine(
    { type: tx.type, transaction_source: tx.transaction_source, reference: tx.reference },
    tx.hub_product_category,
    tx.hub_snapshot,
  )
  const kind = transactionListLineIconKind(line)
  if (kind === "referral") return <ArrowDownLeft size={18} color={colors.success} />
  if (kind === "hub_food") return <UtensilsCrossed size={18} color={colors.primary} />
  if (kind === "experts") return <Sparkles size={18} color={colors.primary} />
  if (kind === "hub_mart") return <ShoppingBag size={18} color={colors.primary} />
  return <ArrowUpRight size={18} color={colors.primary} />
}

const CHIPS: { id: FilterChip; label: string }[] = [
  { id: "all", label: "orders.chipAll" },
  { id: "send", label: "orders.chipSend" },
  { id: "hub", label: "orders.chipHub" },
  { id: "bookings", label: "orders.chipBookings" },
  { id: "referral", label: "orders.chipPayout" },
]

export default function TransactionsScreen() {
  const { t, i18n } = useTranslation("app")
  const locale = i18n.resolvedLanguage || i18n.language || "en"
  const router = useRouter()
  const { isWeb, mode } = useResponsiveLayout()
  const desktop = isWeb && mode === "desktop"
  const { user } = useAuth()
  const chat = useChatUnread(null, Boolean(user))
  const [chip, setChip] = useState<FilterChip>("all")
  const [query, setQuery] = useState("")
  const searchFocus = useInputFocusRing()
  const tabContentPadding = useTabContentPadding()

  // The spend total only shows on the desktop web table. On the phone it summed every currency into one figure, so
  // the list leads instead (the per-currency spending view comes later).
  const volKey = user && desktop ? `ciuna_completed_volume_${user.id}` : null
  const tx = useTransactions(user?.id)
  const vol = useCachedQuery<Volume | null>(volKey, fetchVolume, { ttlMs: TX_TTL_MS })

  const rows = tx.data || []
  const volume = vol.data ?? null
  const loading = tx.loading
  const refreshing = tx.refreshing || vol.refreshing

  const revalidateAll = () => {
    tx.revalidate()
    vol.revalidate()
  }
  useFocusRevalidate(revalidateAll)
  useRevalidateOnForeground(revalidateAll)

  const refreshAll = () => {
    tx.refresh()
    vol.refresh()
  }

  const completedCount = useMemo(
    () => rows.filter((r) => r.status === "completed" || r.status === "deposited").length,
    [rows],
  )

  const filtered = useMemo(
    () => rows.filter((r) => matchesFilterChip(r, chip) && matchesSearch(r, query)),
    [rows, chip, query],
  )
  const groups = useMemo(() => groupByDay(filtered, t, locale), [filtered, t, locale])

  if (desktop) {
    const kindLabel = (x: CombinedTransaction) => {
      const k = transactionListLineIconKind(resolveTransactionListLine({ type: x.type, transaction_source: x.transaction_source, reference: x.reference }, x.hub_product_category, x.hub_snapshot))
      return t(k === "referral" ? "orders.chipPayout" : k === "experts" ? "orders.chipBookings" : k === "hub_food" || k === "hub_mart" ? "orders.chipHub" : "orders.chipSend")
    }
    return (
      <Screen>
        <OrdersDesktop
          chips={CHIPS}
          chip={chip}
          onChip={setChip}
          query={query}
          onQuery={setQuery}
          groups={groups}
          total={rows.length}
          loading={loading}
          error={Boolean(tx.error)}
          offline={Boolean(tx.error) && rows.length > 0}
          volume={volume ? formatMoney(volume.amount, volume.currency) : "—"}
          completed={completedCount}
          locale={locale}
          onRetry={revalidateAll}
          onOpen={(x) => router.push(`/orders/${String(x.transaction_id).toLowerCase()}` as never)}
          onSupport={() => router.push("/support" as never)}
          onClear={() => {
            setQuery("")
            setChip("all")
          }}
          nameOf={(x) => counterparty(x, t)}
          lineOf={kindLabel}
          icon={(x) => <RowIcon tx={x} />}
          unread={(x) => Boolean(x.marketplace_order && chat.byOrder[x.marketplace_order.id] > 0)}
        />
      </Screen>
    )
  }

  return (
    <Screen>
      <Text style={styles.title}>{t("transactions.title", { defaultValue: "Activities" })}</Text>

      <View style={[styles.searchBox, searchFocus.boxStyle]}>
        <Search size={16} color={colors.muted} />
        <AppTextInput
          value={query}
          onChangeText={setQuery}
          onFocus={searchFocus.onFocus}
          onBlur={searchFocus.onBlur}
          placeholder={t("orders.searchPlaceholder", { defaultValue: "Search orders..." })}
          placeholderTextColor={colors.subtle}
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={styles.chipRowContent}
      >
        {CHIPS.map((c) => {
          const active = chip === c.id
          return (
            <Pressable
              key={c.id}
              onPress={() => setChip(c.id)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(c.label)}</Text>
            </Pressable>
          )
        })}
      </ScrollView>

      <ScrollView
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabContentPadding }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={colors.primary} />
        }
      >
        {loading && rows.length === 0
          ? [0, 1, 2, 3, 4].map((i) => <View key={i} style={[styles.row, styles.skeletonRow]} />)
          : null}

        {!loading && tx.error && rows.length === 0 ? <LoadError onRetry={revalidateAll} /> : null}

        {!loading && tx.error && rows.length > 0 ? (
          <Text style={styles.offline}>{t("transactions.offline", { defaultValue: "Showing your saved activity. Pull down to refresh when you are back online." })}</Text>
        ) : null}

        {!loading && !tx.error && rows.length === 0 ? (
          <EmptyState
            title={t("transactions.empty", { defaultValue: "No orders found" })}
            body={t("transactions.emptyHint", { defaultValue: "Start by sending your first transfer" })}
          />
        ) : null}

        {!loading && rows.length > 0 && filtered.length === 0 ? (
          <EmptyState
            title={t("transactions.noSearchResults", { defaultValue: "No orders match your search" })}
            body={t("transactions.adjustSearch", { defaultValue: "Try adjusting your search terms" })}
          />
        ) : null}

        {groups.map((group) => (
          <View key={group.heading} style={styles.group}>
            <Text style={styles.groupHeading}>{group.heading}</Text>
            {group.rows.map((tx) => {
              const amount = isReferralPayout(tx) ? tx.send_amount : (tx.send_amount ?? tx.total_amount)
              return (
                <Pressable
                  key={tx.transaction_id || tx.id}
                  onPress={() => router.push(`/orders/${String(tx.transaction_id).toLowerCase()}` as never)}
                  style={styles.row}
                >
                  <View style={styles.rowIcon}>
                    <RowIcon tx={tx} />
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {counterparty(tx, t)}
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {formatDateTimeLine(tx.created_at, locale)}
                      {tx.marketplace_order?.fulfillment_mode === "delivery" || tx.marketplace_order?.fulfillment_mode === "pickup"
                        ? " · " + t(`marketplace.${tx.marketplace_order.fulfillment_mode}`)
                        : ""}
                    </Text>
                  </View>
                  <View style={styles.rowTrail}>
                    <Text style={styles.rowAmount} numberOfLines={1}>
                      {isReferralPayout(tx) ? "+" : "−"}
                      {formatMoney(amount, tx.send_currency)}
                    </Text>
                    {tx.marketplace_order ? (
                      <View style={styles.orderTrail}>
                        {chat.byOrder[tx.marketplace_order.id] > 0 ? <View style={styles.unreadDot} accessibilityLabel={t("chat.unreadDot", { defaultValue: "New message from the seller" })} /> : null}
                        <StatusChip status={tx.status} />
                      </View>
                    ) : (
                      <StatusChip status={tx.status} />
                    )}
                  </View>
                </Pressable>
              )
            })}
          </View>
        ))}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  orderTrail: { flexDirection: "row", alignItems: "center", gap: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  title: {
    ...textStyles.largeTitle,
    paddingHorizontal: space.gutter,
    paddingTop: 8,
    paddingBottom: 12,
    color: colors.text,
  },
  searchBox: {
    marginHorizontal: 20,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: typeSize.body, color: colors.text, paddingVertical: 10 },
  chipRow: { flexGrow: 0, marginBottom: 8 },
  chipRowContent: { paddingHorizontal: 20, gap: 8 },
  chip: {
    minHeight: 34,
    justifyContent: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typeSize.meta, fontWeight: "600", color: colors.muted },
  chipTextActive: { color: colors.onPrimary },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  skeletonRow: { height: 64, backgroundColor: colors.paper, borderColor: colors.paper },
  offline: { fontSize: typeSize.caption, color: colors.muted, textAlign: "center", marginBottom: 8 },
  group: { marginBottom: 8 },
  groupHeading: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: typeSize.caption,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
  },
  row: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowBody: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  rowMeta: { fontSize: typeSize.caption, color: colors.muted },
  rowTrail: { alignItems: "flex-end", gap: 4 },
  rowAmount: { fontSize: typeSize.body, fontWeight: "700", color: colors.text },
})
