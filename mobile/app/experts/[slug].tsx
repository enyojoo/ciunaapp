import { useEffect, useState } from "react"
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native"
import { StatusBar } from "expo-status-bar"
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { MapPin } from "lucide-react-native"
import { EmptyState } from "@/components/empty-state"
import {
  ExpertServiceCard,
  ExpertServiceSkeleton,
  expertServiceToCatalog,
} from "@/components/expert-catalog"
import { ScreenScroll } from "@/components/screen"
import { apiFetch } from "@/lib/api"
import type { ExpertProfile, ExpertService } from "@/lib/types"
import { colors, radius, type as typeSize } from "@/lib/theme"

/**
 * Expert profile — same plain native header as a product/store screen, not the orange gradient
 * hero: the gradient is reserved for service-line screens (Home → Experts). A real profile-style
 * body underneath: a proper avatar, name, headline/category, location, bio, then bookable services.
 */
export default function ExpertProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const navigation = useNavigation()
  const router = useRouter()
  const { t } = useTranslation("app")
  const [profile, setProfile] = useState<ExpertProfile | null>(null)
  const [services, setServices] = useState<ExpertService[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    void (async () => {
      try {
        const res = await apiFetch(`/api/expert/profiles/${encodeURIComponent(String(slug))}`)
        const body = (await res.json().catch(() => ({}))) as {
          profile?: ExpertProfile
          services?: ExpertService[]
        }
        if (cancelled) return
        if (!res.ok || !body.profile) {
          setProfile(null)
          setServices([])
          setNotFound(true)
          return
        }
        setProfile(body.profile)
        setServices(body.services || [])
      } catch {
        if (!cancelled) {
          setProfile(null)
          setServices([])
          setNotFound(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug])

  // No title — the expert's name is already the big heading in the body; a repeated header title is redundant.
  useEffect(() => {
    navigation.setOptions({ title: "" })
  }, [navigation])

  const bio = (profile?.bio || "").trim()
  const meeting = (profile?.meeting_hint || "").trim()
  const showBioFrame = Boolean(bio || meeting)
  const category = (profile?.category || "").trim()
  const location = (profile?.service_area || "").trim()

  if (loading && !profile) {
    return (
      <ScreenScroll edges={["left", "right"]}>
        <StatusBar style="dark" />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenScroll>
    )
  }

  if (notFound || !profile) {
    return (
      <ScreenScroll edges={["left", "right"]}>
        <StatusBar style="dark" />
        <EmptyState
          title={t("hub.expertNotFound", { defaultValue: "Expert not found" })}
          actionLabel={t("hub.expertsAll", { defaultValue: "All experts" })}
          onAction={() => router.replace("/experts" as never)}
        />
      </ScreenScroll>
    )
  }

  return (
    <ScreenScroll edges={["left", "right"]}>
      <StatusBar style="dark" />
      <View style={styles.identityRow}>
        <View style={styles.avatarWrap}>
          {profile.image_url ? (
            <Image source={{ uri: profile.image_url }} style={styles.avatar} resizeMode="cover" />
          ) : null}
        </View>
        <View style={styles.identityBody}>
          <Text style={styles.name} numberOfLines={2}>
            {profile.display_name}
          </Text>
          {profile.headline ? (
            <Text style={styles.headline} numberOfLines={2}>
              {profile.headline}
            </Text>
          ) : null}
          {category ? <Text style={styles.category}>{category}</Text> : null}
          {location ? (
            <View style={styles.locRow}>
              <MapPin size={13} color={colors.muted} strokeWidth={2} />
              <Text style={styles.loc} numberOfLines={1}>
                {location}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {showBioFrame ? (
        <View style={styles.bioFrame}>
          {bio ? <Text style={styles.bio}>{bio}</Text> : null}
          {meeting ? <Text style={[styles.meeting, bio ? styles.meetingRule : null]}>{meeting}</Text> : null}
        </View>
      ) : null}

      <Text style={styles.heading}>{t("experts.profile.servicesHeading", { defaultValue: "Services" })}</Text>
      {loading && services.length === 0 ? (
        <View style={styles.grid}>
          <ExpertServiceSkeleton />
          <ExpertServiceSkeleton />
          <ExpertServiceSkeleton />
          <ExpertServiceSkeleton />
        </View>
      ) : services.length === 0 ? (
        <EmptyState title={t("experts.profile.noServices", { defaultValue: "No bookable services yet." })} />
      ) : (
        <View style={styles.grid}>
          {services.map((s) => (
            <ExpertServiceCard
              key={s.id}
              service={expertServiceToCatalog(s, profile)}
              showExpert={false}
              showTypicalSession
            />
          ))}
        </View>
      )}
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  center: { paddingVertical: 60, alignItems: "center" },
  identityRow: { flexDirection: "row", gap: 14, marginBottom: 20 },
  avatarWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: "hidden",
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: { width: "100%", height: "100%" },
  identityBody: { flex: 1, minWidth: 0, justifyContent: "center", gap: 3 },
  name: { fontSize: 20, fontWeight: "700", letterSpacing: -0.3, color: colors.text },
  headline: { fontSize: typeSize.body, color: colors.text },
  category: { fontSize: typeSize.meta, fontWeight: "600", color: colors.primary },
  locRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  loc: { flexShrink: 1, fontSize: typeSize.meta, color: colors.muted },
  bioFrame: {
    marginBottom: 24,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  bio: { fontSize: typeSize.body, lineHeight: 22, color: colors.text },
  meeting: { fontSize: typeSize.body, lineHeight: 22, color: colors.muted },
  meetingRule: { marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  heading: { marginBottom: 16, fontSize: 18, fontWeight: "600", color: colors.text },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
})
