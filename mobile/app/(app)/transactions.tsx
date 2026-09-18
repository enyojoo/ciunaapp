import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Pressable, ScrollView, Text } from "react-native"
import { useTranslation } from "react-i18next"
import { fetchWithAuth } from "@/lib/api"

type Tx = {
  transaction_id: string
  status: string
  send_amount?: number
  send_currency?: string
}

export default function TransactionsScreen() {
  const { t } = useTranslation("app")
  const router = useRouter()
  const [rows, setRows] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetchWithAuth("/api/transactions?type=all&limit=50")
        const data = await res.json()
        setRows((data.transactions || []) as Tx[])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="p-5">
      <Text className="mb-4 text-2xl font-bold">{t("transactions.title", { defaultValue: "Transactions" })}</Text>
      {loading ? <ActivityIndicator color="#F97316" /> : null}
      {rows.map((tx) => (
        <Pressable
          key={tx.transaction_id}
          onPress={() => router.push(`/orders/${tx.transaction_id.toLowerCase()}`)}
          className="border-b border-gray-200 py-3.5"
        >
          <Text className="font-semibold">{tx.transaction_id}</Text>
          <Text className="mt-1 text-gray-500">
            {tx.status} {tx.send_amount != null ? `· ${tx.send_amount} ${tx.send_currency}` : ""}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}
