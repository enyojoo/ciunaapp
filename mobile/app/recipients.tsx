import { useEffect, useState } from "react"
import { ActivityIndicator, ScrollView, Text } from "react-native"
import { fetchWithAuth } from "@/lib/api"

export default function RecipientsScreen() {
  const [rows, setRows] = useState<{ id: string; full_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    void (async () => {
      const res = await fetchWithAuth("/api/recipients")
      const data = await res.json()
      setRows((data.recipients || []) as { id: string; full_name: string }[])
      setLoading(false)
    })()
  }, [])
  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="p-5">
      <Text className="mb-3 text-2xl font-bold">Recipients</Text>
      {loading ? <ActivityIndicator color="#F97316" /> : rows.map((r) => <Text key={r.id} className="py-2.5">{r.full_name}</Text>)}
    </ScrollView>
  )
}
