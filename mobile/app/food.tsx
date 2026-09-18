import { useEffect, useState } from "react"
import { ActivityIndicator, ScrollView, Text } from "react-native"
import { apiFetch } from "@/lib/api"

export default function FoodScreen() {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    void (async () => {
      const res = await apiFetch("/api/hub/products?service_line=food")
      const data = await res.json()
      setCount((data.products || []).length)
    })()
  }, [])
  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="p-5">
      <Text className="text-2xl font-bold">Food</Text>
      {count == null ? <ActivityIndicator color="#F97316" className="mt-5" /> : <Text className="mt-3 text-gray-500">{count} products</Text>}
    </ScrollView>
  )
}
