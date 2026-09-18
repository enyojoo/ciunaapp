import { useEffect, useState } from "react"
import { ScrollView, Text, View } from "react-native"
import { Image } from "expo-image"
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router"
import { EmptyState } from "@/components/empty-state"
import { PrimaryButton } from "@/components/primary-button"
import { Screen } from "@/components/screen"
import { apiFetch } from "@/lib/api"
import { formatMoney } from "@/lib/money"
import type { ExpertProfile, ExpertService } from "@/lib/types"

export default function ExpertProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const navigation = useNavigation()
  const [profile, setProfile] = useState<ExpertProfile | null>(null)
  const [services, setServices] = useState<ExpertService[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    void (async () => {
      const res = await apiFetch(`/api/expert/profiles/${encodeURIComponent(String(slug))}`)
      const body = (await res.json()) as { profile?: ExpertProfile; services?: ExpertService[] }
      setProfile(body.profile || null)
      setServices(body.services || [])
      if (body.profile?.display_name) navigation.setOptions({ title: body.profile.display_name })
      setLoading(false)
    })()
  }, [slug, navigation])

  return (
    <Screen edges={["left", "right"]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {loading ? <Text className="py-8 text-center text-muted">Loading…</Text> : null}
        {profile?.image_url ? (
          <Image
            source={{ uri: profile.image_url }}
            style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: 16, marginBottom: 12 }}
            contentFit="cover"
          />
        ) : null}
        {profile?.headline ? <Text className="text-base text-muted">{profile.headline}</Text> : null}
        {profile?.bio ? <Text className="mt-3 text-base text-gray-900">{profile.bio}</Text> : null}

        <Text className="mb-3 mt-6 text-lg font-semibold text-gray-900">Services</Text>
        {!loading && services.length === 0 ? <EmptyState title="No published services" /> : null}
        {services.map((s) => {
          const price =
            s.pricing_type === "hourly" && s.hourly_rate != null
              ? `${formatMoney(s.hourly_rate, s.hourly_currency)}/hr`
              : s.fixed_amount != null
                ? formatMoney(s.fixed_amount, s.fixed_currency)
                : "Custom quote"
          return (
            <View key={s.id} className="mb-3 rounded-2xl border border-border bg-surface px-4 py-4">
              <Text className="font-semibold text-gray-900">{s.title}</Text>
              {s.short_description ? <Text className="mt-1 text-sm text-muted">{s.short_description}</Text> : null}
              <Text className="mt-2 text-base text-gray-900">{price}</Text>
              <View className="mt-3">
                <PrimaryButton label="Book" onPress={() => router.push(`/experts/book/${s.id}` as never)} />
              </View>
            </View>
          )
        })}
      </ScrollView>
    </Screen>
  )
}
