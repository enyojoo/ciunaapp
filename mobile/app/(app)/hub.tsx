import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Pressable, ScrollView, Text } from "react-native"
import { useTranslation } from "react-i18next"
import { fetchWithAuth } from "@/lib/api"

type Line = { id: string; slug: string; title: string; short_description: string | null }

export default function HubScreen() {
  const { t } = useTranslation("app")
  const router = useRouter()
  const [lines, setLines] = useState<Line[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetchWithAuth("/api/hub/service-lines")
        const data = await res.json()
        setLines((data.serviceLines || []) as Line[])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const openLine = (slug: string) => {
    if (slug === "food") router.push("/food")
    else if (slug === "mart") router.push("/mart")
    else if (slug === "experts") router.push("/experts")
    else if (slug === "assistant") router.push("/assistant")
    else if (slug === "send") router.push("/send")
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="p-5">
      <Text className="mb-2 text-2xl font-bold">{t("hub.heroTitle", { defaultValue: "Hub" })}</Text>
      <Text className="mb-4 text-gray-500">{t("hub.heroBody", { defaultValue: "Services" })}</Text>
      {loading ? <ActivityIndicator color="#F97316" /> : null}
      {lines.map((line) => (
        <Pressable key={line.id} onPress={() => openLine(line.slug)} className="mb-3 rounded-xl border border-gray-200 p-4">
          <Text className="text-base font-semibold">{line.title}</Text>
          {line.short_description ? <Text className="mt-1 text-gray-500">{line.short_description}</Text> : null}
        </Pressable>
      ))}
      <Pressable onPress={() => router.push("/send")} className="mt-2 rounded-xl bg-primary p-4">
        <Text className="text-center font-bold text-white">{t("send.title", { defaultValue: "Send money" })}</Text>
      </Pressable>
    </ScrollView>
  )
}
