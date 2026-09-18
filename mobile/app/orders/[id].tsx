import { useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Text, View } from "react-native"
import { Screen } from "@/components/screen"
import { fetchWithAuth } from "@/lib/api"

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [tx, setTx] = useState<{ transaction_id?: string; status?: string } | null>(null)
  useEffect(() => {
    if (!id) return
    void (async () => {
      const res = await fetchWithAuth(`/api/transactions?type=all&limit=100`)
      const data = await res.json()
      const match = (data.transactions || []).find(
        (row: { transaction_id: string }) => row.transaction_id.toLowerCase() === String(id).toLowerCase(),
      )
      setTx(match || { transaction_id: String(id) })
    })()
  }, [id])
  if (!tx) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#F97316" />
      </View>
    )
  }
  return (
    <Screen className="px-5">
      <Text className="text-2xl font-bold">{tx.transaction_id}</Text>
      <Text className="mt-2 text-gray-500">{tx.status}</Text>
    </Screen>
  )
}
