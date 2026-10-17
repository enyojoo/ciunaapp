import { useEffect } from "react"
import { NARROW_COLUMN } from "@/lib/layout-metrics"
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native"
import { StatusBar } from "expo-status-bar"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { MapPin } from "lucide-react-native"
import { FavouriteHeart } from "@/components/favourite-heart"
import { RatingLine, ReviewsSection } from "@/components/reviews-section"
import { useReviews } from "@/lib/use-reviews"
import { HubTopBar } from "@/components/hub-top-bar"
import { EmptyState } from "@/components/empty-state"
import { LoadError } from "@/components/load-error"
import {
  ExpertServiceCard,
  ExpertServiceSkeleton,
  expertServiceToCatalog,
} from "@/components/expert-catalog"
import { ScreenScroll } from "@/components/screen"
import { EXPERT_NOT_FOUND, useExpertProfile } from "@/lib/use-expert-profile"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useRevalidateOnForeground } from "@/lib/use-revalidate-on-foreground"
import { VerifiedBadge } from "@/components/verified-badge"
import { ShareButton } from "@/components/share-button"
import { expertLink } from "@/lib/share-link"
import { languageName } from "@/lib/language-name"
import { colors, radius, type as typeSize } from "@/lib/theme"

/**
 * Expert profile — same plain native header as a product/store screen, not the orange gradient
 * hero: the gradient is reserved for service-line screens (Home → Experts). A real profile-style
 * body underneath: a proper avatar, name, headline/category, location, bio, then bookable services.
 */
function ExpertProfileBody() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const { t, i18n } = useTranslation("app")
  const { data, loading, error, revalidate } = useExpertProfile(slug)
  const profile = data?.profile ?? null
  const services = data?.services ?? []
  const notFound = !loading && (Boolean(error) || !profile)

  useFocusRevalidate(revalidate)
  useRevalidateOnForeground(revalidate)

  const reviews = useReviews(profile ? { kind: "expert", slug: String(slug) } : null)
  const profileId = profile?.id ?? null



  const bio = (profile?.bio || "").trim()
  const meeting = (profile?.meeting_hint || "").trim()
  const showBioFrame = Boolean(bio || meeting)
  const category = (profile?.category || "").trim()
  const location = (profile?.service_area || "").trim()
  const languages = profile?.languages ?? []
  const credentials = profile?.credentials ?? []

  if (loading && !profile) {
    return (
      <ScreenScroll edges={["left", "right"]} contentStyle={NARROW_COLUMN}>
        <StatusBar style="dark" />
        <View style={styles.identityRow} accessibilityLabel={t("common.loading", { defaultValue: "Loading" })}>
          <View style={[styles.avatarWrap, styles.skel]} />
          <View style={styles.identityBody}>
            <View style={[styles.skelBar, { width: "60%", height: 22 }]} />
            <View style={[styles.skelBar, { width: "80%", marginTop: 10 }]} />
            <View style={[styles.skelBar, { width: "40%", marginTop: 10 }]} />
          </View>
        </View>
        <View style={[styles.skelBar, { height: 96, marginTop: 20, borderRadius: 16 }]} />
        <View style={[styles.skelBar, { height: 96, marginTop: 12, borderRadius: 16 }]} />
      </ScreenScroll>
    )
  }

  if (error && !profile && !(error instanceof Error && error.message === EXPERT_NOT_FOUND)) {
    return (
      <ScreenScroll edges={["left", "right"]} contentStyle={NARROW_COLUMN}>
        <StatusBar style="dark" />
        <LoadError onRetry={() => void revalidate()} />
      </ScreenScroll>
    )
  }

  if (notFound || !profile) {
    return (
      <ScreenScroll edges={["left", "right"]} contentStyle={NARROW_COLUMN}>
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
    <ScreenScroll edges={["left", "right"]} contentStyle={NARROW_COLUMN}>
      <StatusBar style="dark" />
      <View style={styles.identityRow}>
        <View style={styles.avatarWrap}>
          {profile.image_url ? (
            <Image source={{ uri: profile.image_url }} style={styles.avatar} resizeMode="cover" />
          ) : (
            <View style={styles.initialWrap}>
              <Text style={styles.initial}>{(profile.display_name.trim().charAt(0) || "?").toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={styles.identityBody}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={2}>
              {profile.display_name}
            </Text>
            {profile.is_verified ? <VerifiedBadge size={18} kind="expert" tier={profile.verification_tier} explain /> : null}
            {profile.slug ? <ShareButton url={expertLink(profile.slug)} title={profile.display_name} /> : null}
          </View>
          {profile.headline ? (
            <Text style={styles.headline} numberOfLines={2}>
              {profile.headline}
            </Text>
          ) : null}
          {category ? <Text style={styles.category}>{category}</Text> : null}
          <RatingLine summary={reviews.summary} />
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

      {languages.length > 0 || credentials.length > 0 || profile.years_experience ? (
        <View style={styles.detailsFrame}>
          {languages.length > 0 ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t("experts.profile.languages", { defaultValue: "Speaks" })}</Text>
              <Text style={styles.detailValue}>{languages.map((l) => languageName(l, i18n.language)).join(", ")}</Text>
            </View>
          ) : null}
          {profile.years_experience ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailValue}>{t("experts.profile.yearsExp", { n: profile.years_experience, defaultValue: "{{n}} years of experience" })}</Text>
            </View>
          ) : null}
          {credentials.length > 0 ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t("experts.profile.credentials", { defaultValue: "Credentials" })}</Text>
              {credentials.map((c, i) => (
                <Text key={i} style={styles.detailValue}>
                  {[c.title, c.issuer, c.year].filter(Boolean).join(" · ")}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

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
      <ReviewsSection state={reviews} />
    </ScreenScroll>
  )
}


/** Same top bar as the hub screens: back chip and the favourite heart. */
export default function ExpertProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { data } = useExpertProfile(slug)
  const profileId = data?.profile?.id ?? null
  return (
    <View style={{ flex: 1 }}>
      <HubTopBar
        backHref="/experts"
        trailing={profileId ? <FavouriteHeart type="expert" id={profileId} style={styles.barHeart} /> : null}
      />
      <ExpertProfileBody />
    </View>
  )
}

const styles = StyleSheet.create({
  skel: { backgroundColor: colors.neutralSurface },
  skelBar: { height: 14, borderRadius: 7, backgroundColor: colors.neutralSurface },
  initialWrap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryTint },
  initial: { fontSize: 28, fontWeight: "700", color: colors.primaryText },
  // A plain 40px icon button in the top bar, the same size as the back chip.
  barHeart: { position: "relative", top: 0, right: 0, width: 40, height: 40, borderRadius: 20, backgroundColor: "transparent", shadowOpacity: 0, elevation: 0 },
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
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  detailsFrame: { marginBottom: 16, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, gap: 12 },
  detailRow: { gap: 2 },
  detailLabel: { fontSize: 12, fontWeight: "600", color: colors.muted },
  detailValue: { fontSize: typeSize.body, lineHeight: 22, color: colors.text },
  name: { flexShrink: 1, fontSize: 20, fontWeight: "700", letterSpacing: -0.3, color: colors.text },
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
