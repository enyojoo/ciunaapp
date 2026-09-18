import { useEffect, useState } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { EmptyState } from "@/components/empty-state"
import { Screen } from "@/components/screen"
import { apiFetch } from "@/lib/api"
import type { ExpertProfile } from "@/lib/types"

export default function ExpertsDirectory() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<ExpertProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const res = await apiFetch("/api/expert/profiles")
      const body = (await res.json()) as { profiles?: ExpertProfile[] }
      setProfiles(body.profiles || [])
      setLoading(false)
    })()
  }, [])

  return (
    <Screen edges={["left", "right"]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {loading ? <Text className="py-8 text-center text-muted">Loading…</Text> : null}
        {!loading && profiles.length === 0 ? (
          <EmptyState title="No experts yet" body="Check back when office publishes profiles." />
        ) : null}
        {profiles.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => router.push(`/experts/${encodeURIComponent(p.slug || p.id)}` as never)}
            className="mb-3 min-h-[72px] flex-row items-center rounded-2xl border border-border bg-surface px-3 py-3"
          >
            {p.image_url ? (
              <Image source={{ uri: p.image_url }} style={{ width: 56, height: 56, borderRadius: 28 }} />
            ) : (
              <View className="h-14 w-14 rounded-full bg-paper" />
            )}
            <View className="ml-3 flex-1">
              <Text className="font-semibold text-gray-900">{p.display_name}</Text>
              {p.headline ? (
                <Text className="text-sm text-muted" numberOfLines={2}>
                  {p.headline}
                </Text>
              ) : null}
              {p.pricing_hint ? <Text className="mt-1 text-sm text-gray-900">{p.pricing_hint}</Text> : null}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  )
}
