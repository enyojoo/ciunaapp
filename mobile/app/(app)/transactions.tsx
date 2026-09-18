import { useCallback, useEffect, useState } from "react"
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { ArrowUpRight, ShoppingBag, Sparkles, UtensilsCrossed } from "lucide-react-native"
import { resolveTransactionListLine, transactionListLineIconKind } from "@ciuna/shared"
import { EmptyState } from "@/components/empty-state"
import { Screen } from "@/components/screen"
import { StatusChip } from "@/components/status-chip"
import { fetchWithAuth } from "@/lib/api"
import { formatMoney } from "@/lib/money"
import { colors } from "@/lib/theme"
import type { CombinedTransaction } from "@/lib/types"

function counterparty(tx: CombinedTransaction): string {
  const snap = tx.hub_snapshot
  if (snap && typeof snap.productTitle === "string" && snap.productTitle.trim()) return snap.productTitle
  if (tx.recipient?.full_name?.trim()) return tx.recipient.full_name
  if (tx.delivery_address_line?.trim()) return tx.delivery_address_line
  return "Transfer"
}

function RowIcon({ tx }: { tx: CombinedTransaction }) {
  const line = resolveTransactionListLine(
    { type: tx.type, transaction_source: tx.transaction_source, reference: tx.reference },
    tx.hub_product_category,
    tx.hub_snapshot,
  )
  const kind = transactionListLineIconKind(line)
  const color = colors.primary
  if (kind === "hub_food") return <UtensilsCrossed size={18} color={color} />
  if (kind === "experts") return <Sparkles size={18} color={color} />
  if (kind === "hub_mart") return <ShoppingBag size={18} color={color} />
  return <ArrowUpRight size={18} color={color} />
}

export default function TransactionsScreen() {
  const { t } = useTranslation("app")
  const router = useRouter()
  const [rows, setRows] = useState<CombinedTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/transactions?type=all&limit=100")
      const data = (await res.json()) as { transactions?: CombinedTransaction[] }
      setRows(data.transactions || [])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <Screen>
      <Text className="px-5 pb-3 pt-1 text-2xl font-bold text-gray-900">
        {t("transactions.title", { defaultValue: "Transactions" })}
      </Text>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load() }} tintColor="#F97316" />
        }
      >
        {loading ? <Text className="py-8 text-center text-muted">Loading…</Text> : null}
        {!loading && rows.length === 0 ? (
          <EmptyState title="No activity yet" body="Food, mart, send, and expert orders show up here." />
        ) : null}
        {rows.map((tx) => {
          const amount = tx.send_amount ?? tx.total_amount
          const currency = tx.send_currency
          return (
            <Pressable
              key={tx.transaction_id || tx.id}
              onPress={() => router.push(`/orders/${String(tx.transaction_id).toLowerCase()}` as never)}
              className="min-h-[64px] flex-row items-center border-b border-border py-3.5"
            >
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-surface">
                <RowIcon tx={tx} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">{formatMoney(amount, currency)}</Text>
                <Text className="text-sm text-muted" numberOfLines={1}>
                  {counterparty(tx)}
                </Text>
              </View>
              <StatusChip status={tx.status} />
            </Pressable>
          )
        })}
      </ScrollView>
    </Screen>
  )
}
