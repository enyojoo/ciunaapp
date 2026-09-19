import { useMemo, useState } from "react"
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { ArrowDownLeft, ArrowUpRight, Search, ShoppingBag, Sparkles, UtensilsCrossed, Wallet } from "lucide-react-native"
import { resolveTransactionListLine, transactionListLineIconKind } from "@ciuna/shared"
import { EmptyState } from "@/components/empty-state"
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
} from "@/lib/transactions"
import { useCachedQuery } from "@/lib/use-cached-query"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useRevalidateOnForeground } from "@/lib/use-revalidate-on-foreground"
import { colors, radius, type as typeSize } from "@/lib/theme"
import type { CombinedTransaction } from "@/lib/types"

const TX_TTL_MS = 2 * 60_000

async function fetchTransactions(): Promise<CombinedTransaction[]> {
  const res = await fetchWithAuth("/api/transactions?type=all&limit=100")
  if (!res.ok) throw new Error("Failed to load transactions")
  const data = (await res.json()) as { transactions?: CombinedTransaction[] }
  return data.transactions || []
}

type Volume = { amount: number; currency: string }

async function fetchVolume(): Promise<Volume | null> {
  const res = await fetchWithAuth("/api/user/completed-volume")
  if (!res.ok) throw new Error("Failed to load completed volume")
  const data = (await res.json()) as { volume?: number; baseCurrency?: string }
  if (data.volume == null || !data.baseCurrency) return null
  return { amount: data.volume, currency: data.baseCurrency }
}

function counterparty(tx: CombinedTransaction, t: (key: string, options?: Record<string, unknown>) => string): string {
  if (isReferralPayout(tx)) return t("transactions.referralPayout")
  const snap = tx.hub_snapshot
  if (snap && typeof snap.productTitle === "string" && snap.productTitle.trim()) return snap.productTitle
  if (tx.recipient?.full_name?.trim()) {
    return t("orders.rowSentTo", { name: tx.recipient.full_name, defaultValue: `Sent to ${tx.recipient.full_name}` })
  }
  if (tx.delivery_address_line?.trim()) return tx.delivery_address_line
  return t("orders.rowHubOrder", { defaultValue: "Hub order" })
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
  { id: "referral", label: "orders.chipPayout" },
]

export default function TransactionsScreen() {
  const { t, i18n } = useTranslation("app")
  const locale = i18n.resolvedLanguage || i18n.language || "en"
  const router = useRouter()
  const { user } = useAuth()
  const [chip, setChip] = useState<FilterChip>("all")
  const [query, setQuery] = useState("")

  const txKey = user ? `ciuna_transactions_${user.id}` : null
  const volKey = user ? `ciuna_completed_volume_${user.id}` : null
  const tx = useCachedQuery<CombinedTransaction[]>(txKey, fetchTransactions, { ttlMs: TX_TTL_MS })
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

  return (
    <Screen>
      <Text style={styles.title}>{t("transactions.title", { defaultValue: "Transactions" })}</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Wallet size={16} color={colors.primaryDeep} strokeWidth={2.2} />
          </View>
          <Text style={styles.summaryLabel}>{t("orders.totalVolume")}</Text>
          <Text style={styles.summaryValue} numberOfLines={1}>
            {volume ? formatMoney(volume.amount, volume.currency) : "—"}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <ArrowUpRight size={16} color={colors.primaryDeep} strokeWidth={2.2} />
          </View>
          <Text style={styles.summaryLabel}>{t("orders.totalTransactions")}</Text>
          <Text style={styles.summaryValue}>{completedCount}</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Search size={16} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("orders.searchPlaceholder", { defaultValue: "Search transactions..." })}
          placeholderTextColor="#9CA3AF"
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
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={colors.primary} />
        }
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}

        {!loading && rows.length === 0 ? (
          <EmptyState
            title={t("transactions.empty", { defaultValue: "No transactions found" })}
            body={t("transactions.emptyHint", { defaultValue: "Start by sending your first transfer" })}
          />
        ) : null}

        {!loading && rows.length > 0 && filtered.length === 0 ? (
          <EmptyState
            title={t("transactions.noSearchResults", { defaultValue: "No transactions match your search" })}
            body={t("transactions.adjustSearch", { defaultValue: "Try adjusting your search terms" })}
          />
        ) : null}

        {groups.map((group) => (
          <View key={group.heading} style={styles.group}>
            <Text style={styles.groupHeading}>{group.heading}</Text>
            {group.rows.map((tx) => {
              const amount = isReferralPayout(tx) ? tx.send_amount : tx.send_amount ?? tx.total_amount
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
                    </Text>
                  </View>
                  <View style={styles.rowTrail}>
                    <Text style={styles.rowAmount} numberOfLines={1}>
                      {formatMoney(amount, tx.send_currency)}
                    </Text>
                    <StatusChip status={tx.status} />
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
  title: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12, fontSize: 24, fontWeight: "700", color: colors.text },
  summaryRow: { flexDirection: "row", gap: 12, paddingHorizontal: 20, marginBottom: 12 },
  summaryCard: {
    flex: 1,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 4,
  },
  summaryIcon: {
    width: 28,
    height: 28,
    marginBottom: 2,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.heroBody,
  },
  summaryLabel: { fontSize: 12, color: colors.muted },
  summaryValue: { fontSize: 17, fontWeight: "700", color: colors.text },
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
  chipText: { fontSize: 13, fontWeight: "600", color: colors.muted },
  chipTextActive: { color: "#fff" },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  center: { paddingVertical: 40, alignItems: "center" },
  group: { marginBottom: 8 },
  groupHeading: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 12,
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
  rowMeta: { fontSize: 12, color: colors.muted },
  rowTrail: { alignItems: "flex-end", gap: 4 },
  rowAmount: { fontSize: typeSize.body, fontWeight: "700", color: colors.text },
})
