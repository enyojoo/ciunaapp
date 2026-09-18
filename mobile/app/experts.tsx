import { useEffect, useState } from "react"
import { ActivityIndicator, ScrollView, Text } from "react-native"
import { apiFetch } from "@/lib/api"

export default function ExpertsScreen() {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    void (async () => {
      const res = await apiFetch("/api/expert/profiles")
      const data = await res.json()
      setCount((data.profiles || data.experts || []).length)
    })()
  }, [])
  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="p-5">
      <Text className="text-2xl font-bold">Experts</Text>
      {count == null ? <ActivityIndicator color="#F97316" className="mt-5" /> : <Text className="mt-3 text-gray-500">{count} experts</Text>}
    </ScrollView>
  )
}
