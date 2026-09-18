import { useEffect, useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { EmptyState } from "@/components/empty-state"
import {
  ExpertServiceCard,
  ExpertServiceSkeleton,
  expertServiceToCatalog,
} from "@/components/expert-catalog"
import { HubLinePageShell } from "@/components/hub-line-page-shell"
import { apiFetch } from "@/lib/api"
import type { ExpertProfile, ExpertService } from "@/lib/types"
import { colors, radius, type as typeSize } from "@/lib/theme"

export default function ExpertProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
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

  const bio = (profile?.bio || "").trim()
  const meeting = (profile?.meeting_hint || "").trim()
  const showBioFrame = Boolean(bio || meeting)

  if (!loading && (notFound || !profile)) {
    return (
      <HubLinePageShell
        title={t("hub.expertNotFound", { defaultValue: "Expert not found" })}
        subtitle={null}
        backAriaLabel={t("hub.backToExperts", { defaultValue: "Back to experts" })}
        backHref="/experts"
      >
        <EmptyState
          title={t("hub.expertNotFound", { defaultValue: "Expert not found" })}
          actionLabel={t("hub.expertsAll", { defaultValue: "All experts" })}
          onAction={() => router.replace("/experts" as never)}
        />
      </HubLinePageShell>
    )
  }

  return (
    <HubLinePageShell
      title={profile?.display_name || t("experts.profile.loadingTitle", { defaultValue: "Expert" })}
      subtitle={profile?.headline ?? null}
      backAriaLabel={t("hub.backToExperts", { defaultValue: "Back to experts" })}
      backHref="/experts"
      photoUrl={profile?.image_url}
      location={profile?.service_area}
      heroLoading={loading && !profile}
    >
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
      ) : profile ? (
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
      ) : null}
    </HubLinePageShell>
  )
}

const styles = StyleSheet.create({
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
