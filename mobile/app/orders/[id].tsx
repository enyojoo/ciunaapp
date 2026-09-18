import { useEffect, useState } from "react"
import { Text, View } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { resolveTransactionListLine, transactionLinePrimaryBadge } from "@ciuna/shared"
import { ScreenScroll } from "@/components/screen"
import { StatusChip } from "@/components/status-chip"
import { fetchWithAuth } from "@/lib/api"
import { formatMoney } from "@/lib/money"
import type { CombinedTransaction } from "@/lib/types"

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [tx, setTx] = useState<CombinedTransaction | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    if (!id) return
    void (async () => {
      const res = await fetchWithAuth("/api/transactions?type=all&limit=100")
      const data = (await res.json()) as { transactions?: CombinedTransaction[] }
      const match = (data.transactions || []).find(
        (row) => String(row.transaction_id).toLowerCase() === String(id).toLowerCase(),
      )
      if (match) setTx(match)
      else setMissing(true)
    })()
  }, [id])

  if (!tx && !missing) {
    return (
      <View className="flex-1 items-center justify-center bg-paper">
        <Text className="text-muted">Loading…</Text>
      </View>
    )
  }

  if (!tx) {
    return (
      <ScreenScroll>
        <Text className="text-xl font-semibold">Order not found</Text>
      </ScreenScroll>
    )
  }

  const line = resolveTransactionListLine(
    { type: tx.type, transaction_source: tx.transaction_source, reference: tx.reference },
    tx.hub_product_category,
    tx.hub_snapshot,
  )
  const badge = transactionLinePrimaryBadge(line)
  const title =
    typeof tx.hub_snapshot?.productTitle === "string" && tx.hub_snapshot.productTitle
      ? String(tx.hub_snapshot.productTitle)
      : tx.recipient?.full_name || badge
  const amount = tx.send_amount ?? tx.total_amount
  const created = tx.created_at ? new Date(tx.created_at).toLocaleString() : ""
  const items = Array.isArray((tx.hub_snapshot as { items?: unknown } | undefined)?.items)
    ? ((tx.hub_snapshot as { items: { title: string; quantity: number; lineTotal: number }[] }).items)
    : null

  return (
    <ScreenScroll>
      <Text className="text-2xl font-bold text-gray-900">{formatMoney(amount, tx.send_currency)}</Text>
      <Text className="mt-1 text-base text-gray-900">{title}</Text>
      <View className="mt-3 flex-row items-center gap-2">
        <View className="rounded-full bg-surface px-2.5 py-0.5">
          <Text className="text-xs font-medium text-gray-900">{badge}</Text>
        </View>
        <StatusChip status={tx.status} />
        {tx.payment_provider === "yookassa" ? (
          <View className="rounded-full bg-surface px-2.5 py-0.5">
            <Text className="text-xs font-medium text-gray-900">Paid online</Text>
          </View>
        ) : null}
      </View>
      {items ? (
        <View className="mt-4 gap-1 rounded-xl bg-surface p-3">
          {items.map((item, idx) => (
            <View key={idx} className="flex-row items-center justify-between gap-2">
              <Text className="flex-1 text-sm text-gray-700" numberOfLines={1}>
                {item.quantity} × {item.title}
              </Text>
              <Text className="text-sm font-medium text-gray-900">
                {formatMoney(item.lineTotal, tx.receive_currency)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {created ? <Text className="mt-4 text-sm text-muted">{created}</Text> : null}
      {tx.receive_amount != null ? (
        <Text className="mt-4 text-base text-gray-900">
          Recipient gets {formatMoney(tx.receive_amount, tx.receive_currency)}
        </Text>
      ) : null}
      {tx.fee_amount != null && Number(tx.fee_amount) > 0 ? (
        <Text className="mt-2 text-sm text-muted">Exchange fee {formatMoney(tx.fee_amount, tx.send_currency)}</Text>
      ) : null}
      {tx.recipient?.bank_name ? (
        <Text className="mt-2 text-sm text-muted">
          {tx.recipient.bank_name}
          {tx.recipient.account_number ? ` · ${tx.recipient.account_number}` : ""}
        </Text>
      ) : null}
    </ScreenScroll>
  )
}
