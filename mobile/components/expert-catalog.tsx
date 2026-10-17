import { Highlighted } from "@/components/highlight"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { VerifiedBadge } from "@/components/verified-badge"
import { useTranslation } from "react-i18next"
import { formatCardPrice } from "@/lib/money"
import { FavouriteHeart } from "@/components/favourite-heart"
import { Avatar, monogramColors } from "@/components/avatar"
import { Icon } from "@/components/ui/icon"
import { PressableScale } from "@/components/ui/pressable-scale"
import { mainCategory, serviceMainCategory } from "@/lib/expert-category"
import type { ExpertCatalogService, ExpertProfile, ExpertService } from "@/lib/types"
import { seedExpertCatalogService } from "@/lib/use-expert-catalog-services"
import { catalogCardWidth, useCatalogGridColumns } from "@/lib/responsive-layout"
import { colors, radius, shadow, type as typeSize } from "@/lib/theme"

export function expertProfilePath(p: { id: string; slug?: string | null }): string {
  return `/experts/${encodeURIComponent(p.slug || p.id)}`
}

export function expertBookPath(serviceId: string): string {
  return `/experts/book/${encodeURIComponent(serviceId)}`
}

export function expertServicePath(serviceId: string): string {
  return `/experts/s/${encodeURIComponent(serviceId)}`
}

export function expertServiceToCatalog(s: ExpertService, expert: ExpertProfile): ExpertCatalogService {
  return {
    id: s.id,
    title: s.title,
    short_description: s.short_description,
    fulfillment_type: s.fulfillment_type,
    pricing_type: s.pricing_type,
    hourly_rate: s.hourly_rate,
    hourly_currency: s.hourly_currency,
    fixed_amount: s.fixed_amount,
    fixed_currency: s.fixed_currency,
    package_label: s.package_label,
    default_duration_minutes: s.default_duration_minutes,
    expert: {
      id: expert.id,
      slug: expert.slug,
      display_name: expert.display_name,
      image_url: expert.image_url,
      category: expert.category,
    },
  }
}

/**
 * Featured expert: photo (or a soft monogram), name, what they do, and rating plus starting price, so the card
 * answers "who is this and can they help me" before the tap.
 */
export function ExpertFeaturedChip({ expert }: { expert: ExpertProfile }) {
  const router = useRouter()
  const { t } = useTranslation("app")
  const tone = monogramColors(expert.display_name)
  const what = (expert.headline || expert.category || "").trim()
  const rated = Number(expert.rating_count) > 0 && Number(expert.rating_avg) > 0
  const fp = expert.from_price
  const price =
    fp && "quote" in fp
      ? t("experts.directory.customQuote", { defaultValue: "Custom quote" })
      : fp
        ? t(fp.per === "hour" ? "experts.directory.fromPerHour" : "experts.directory.from", { price: formatCardPrice(fp.amount, fp.currency), defaultValue: fp.per === "hour" ? "From {{price}}/hr" : "From {{price}}" })
        : null
  return (
    <View style={styles.featHit}>
      <PressableScale
        onPress={() => router.push(expertProfilePath(expert) as never)}
        scaleTo={0.97}
        accessibilityRole="button"
        accessibilityLabel={[expert.display_name, what, price].filter(Boolean).join(". ")}
        style={styles.featCard}
      >
        <View style={[styles.featPhoto, { backgroundColor: expert.image_url ? colors.fill : tone.bg }]}>
          {expert.image_url ? (
            <Image source={{ uri: expert.image_url }} style={styles.photoImg} contentFit="cover" transition={150} />
          ) : (
            <Text style={[styles.featInitials, { color: tone.fg }]}>{initialsOf(expert.display_name)}</Text>
          )}
        </View>
        <View style={styles.featBody}>
          <View style={styles.dirNameRow}>
            <Text style={styles.featName} numberOfLines={1}>
              {expert.display_name}
            </Text>
            {expert.is_verified ? <VerifiedBadge size={13} kind="expert" tier={expert.verification_tier} /> : null}
          </View>
          <Text style={styles.featWhat} numberOfLines={2}>
            {what || " "}
          </Text>
          <Text style={styles.featMeta} numberOfLines={1}>
            {[rated ? `★ ${Number(expert.rating_avg).toFixed(1)}` : null, price].filter(Boolean).join(" · ") || " "}
          </Text>
        </View>
      </PressableScale>
      <FavouriteHeart type="expert" id={expert.id} />
    </View>
  )
}

function initialsOf(name: string): string {
  const parts = name.replace(/^(dr|mr|mrs|ms)\.?\s+/i, "").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  return ((parts[0]![0] || "") + (parts.length > 1 ? parts[parts.length - 1]![0] : "")).toUpperCase()
}

export function ExpertFeaturedSkeleton() {
  return <View style={[styles.featHit, styles.featSkeleton]} />
}

export function ExpertDirectoryCard({ expert, onBeforeNavigate }: { expert: ExpertProfile; onBeforeNavigate?: () => void }) {
  const router = useRouter()
  const { t, i18n } = useTranslation("app")
  const directoryColumns = useCatalogGridColumns()
  const fp = expert.from_price
  const priceLine =
    fp && "quote" in fp
      ? t("experts.directory.customQuote", { defaultValue: "Custom quote" })
      : fp
        ? t(fp.per === "hour" ? "experts.directory.fromPerHour" : "experts.directory.from", { price: formatCardPrice(fp.amount, fp.currency), defaultValue: fp.per === "hour" ? "From {{price}}/hr" : "From {{price}}" })
        : expert.pricing_hint || null
  const nextLine = expert.next_available_at
    ? t("experts.directory.nextAvailable", { when: new Date(expert.next_available_at).toLocaleString(i18n.language, { weekday: "short", hour: "numeric", minute: "2-digit" }), defaultValue: "Next: {{when}}" })
    : null
  return (
    <View style={[styles.gridHit, { width: catalogCardWidth(directoryColumns) }]}>
    <Pressable
      onPress={() => { onBeforeNavigate?.(); router.push(expertProfilePath(expert) as never) }}
      accessibilityRole="button"
      accessibilityLabel={expert.display_name}
    >
      <View style={styles.stripCard}>
        <View style={styles.stripPhoto}>
          {expert.image_url ? (
            <Image source={{ uri: expert.image_url }} style={styles.photoImg} contentFit="cover" />
          ) : (
            <View style={styles.photoFallback}>
              <Text style={styles.initialLg}>{(expert.display_name.trim().charAt(0) || "?").toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={styles.dirCaption}>
          <View style={styles.dirNameRow}>
            <Highlighted style={styles.dirName} numberOfLines={1} ellipsizeMode="tail" text={expert.display_name} />
            {expert.is_verified ? <VerifiedBadge size={13} kind="expert" tier={expert.verification_tier} /> : null}
          </View>
          <Text style={styles.rating} numberOfLines={1}>
            {Number(expert.rating_count) > 0 && Number(expert.rating_avg) > 0
              ? `★ ${Number(expert.rating_avg).toFixed(1)} (${expert.rating_count})`
              : " "}
          </Text>
          {/* Both lines are always drawn so every expert card has the same height. */}
          <Text style={styles.hint} numberOfLines={1}>
            {priceLine || " "}
          </Text>
          <Text style={styles.hint} numberOfLines={1}>
            {nextLine || " "}
          </Text>
        </View>
      </View>
    </Pressable>
    <FavouriteHeart type="expert" id={expert.id} />
    </View>
  )
}

/**
 * A bookable service, laid out like a Mart product card: a picture block (the need's colour and glyph, with duration
 * and online or in person on it), then the title, who gives it, and the price with a small Book button. The whole
 * card opens the service; Book goes straight to picking a time.
 */
export function ExpertServiceCard({
  service,
  showExpert = true,
}: {
  service: ExpertCatalogService
  showExpert?: boolean
  /** @deprecated Duration now always shows on the picture. */
  showTypicalSession?: boolean
}) {
  const { t } = useTranslation("app")
  const router = useRouter()
  const columns = useCatalogGridColumns()
  const expert = service.expert
  const cat = mainCategory(serviceMainCategory(service))
  const minutes = Number(service.default_duration_minutes) || 0
  const where =
    service.fulfillment_type === "in_person"
      ? t("experts.profile.fulfillmentInPerson", { defaultValue: "In person" })
      : service.fulfillment_type === "both"
        ? t("experts.profile.fulfillmentBoth", { defaultValue: "Online or in person" })
        : t("experts.profile.fulfillmentOnline", { defaultValue: "Online" })
  const quote = service.pricing_type === "quote"

  const openDetail = () => {
    seedExpertCatalogService(service)
    router.push(expertServicePath(service.id) as never)
  }

  return (
    <View style={[styles.svcHit, { width: catalogCardWidth(columns) }]}>
      <PressableScale onPress={openDetail} scaleTo={0.97} accessibilityRole="button" accessibilityLabel={`${service.title}. ${expert.display_name}`} style={styles.svcCard}>
        <View style={[styles.svcMedia, { backgroundColor: cat.bg }]}>
          <View style={styles.svcGlyph} pointerEvents="none">
            <Icon name={cat.icon} size={64} color={cat.fg} strokeWidth={1.5} />
          </View>
          <View style={styles.svcTags}>
            {minutes > 0 ? (
              <View style={styles.svcTag}>
                <Icon name="clock" size={11} color={colors.text} />
                <Text style={styles.svcTagText}>{t("experts.card.minutes", { count: minutes, defaultValue: "{{count}} min" })}</Text>
              </View>
            ) : null}
            <View style={styles.svcTag}>
              <Text style={styles.svcTagText} numberOfLines={1}>
                {where}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.svcBody}>
          <Text style={styles.svcTitle} numberOfLines={2}>
            {service.title}
          </Text>
          {showExpert ? (
            <View style={styles.expertRow}>
              <Avatar name={expert.display_name} uri={expert.image_url} size={20} />
              <Text style={styles.expertName} numberOfLines={1}>
                {expert.display_name}
              </Text>
              {expert.is_verified ? <VerifiedBadge size={13} kind="expert" /> : null}
            </View>
          ) : null}
          <View style={styles.svcFoot}>
            <View style={styles.svcPrice}>
              <ServicePriceRow service={service} />
            </View>
            {quote ? null : (
              <PressableScale
                onPress={() => router.push(expertBookPath(service.id) as never)}
                haptics
                scaleTo={0.92}
                accessibilityRole="button"
                accessibilityLabel={t("experts.profile.bookSession", { defaultValue: "Book a session" })}
                hitSlop={6}
                style={styles.book}
              >
                <Text style={styles.bookText}>{t("experts.card.book", { defaultValue: "Book" })}</Text>
              </PressableScale>
            )}
          </View>
        </View>
      </PressableScale>
    </View>
  )
}

export function ExpertServiceSkeleton() {
  const columns = useCatalogGridColumns()
  return <View style={[styles.svcHit, { width: catalogCardWidth(columns) }, styles.svcSkeleton]} />
}

export function ServicePriceRow({ service: s }: { service: ExpertCatalogService }) {
  const { t } = useTranslation("app")
  if (s.pricing_type === "quote") {
    return (
      <View style={styles.priceRow}>
        <Text style={styles.pricePrefix}>
          {t("experts.bookingWizard.priceQuote", { defaultValue: "We’ll agree price later" })}
        </Text>
      </View>
    )
  }
  if (s.pricing_type === "hourly" && s.hourly_rate != null) {
    return (
      <View style={styles.priceRow}>
        <Text style={styles.price}>{formatCardPrice(s.hourly_rate, s.hourly_currency)}</Text>
        <Text style={styles.priceSuffix}>{t("experts.card.perHour", { defaultValue: "/hr" })}</Text>
      </View>
    )
  }
  if (s.pricing_type === "fixed" && s.fixed_amount != null) {
    return (
      <View style={styles.priceRow}>
        <Text style={styles.price}>{formatCardPrice(s.fixed_amount, s.fixed_currency)}</Text>
        {s.package_label ? <Text style={styles.priceSuffix}>— {s.package_label}</Text> : null}
      </View>
    )
  }
  return (
    <View style={styles.priceRow}>
      <Text style={styles.pricePrefix}>{t("experts.bookingWizard.priceDash", { defaultValue: "—" })}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  featHit: { width: 168 },
  featSkeleton: { height: 236, borderRadius: radius.card, backgroundColor: colors.fill },
  featCard: { borderRadius: radius.card, backgroundColor: colors.surface, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  featPhoto: { width: "100%", aspectRatio: 1.15, alignItems: "center", justifyContent: "center" },
  featInitials: { fontSize: typeSize.largeTitle, fontWeight: "700", letterSpacing: -0.5 },
  featBody: { padding: 10, gap: 3 },
  featName: { flexShrink: 1, fontSize: typeSize.label, fontWeight: "700", color: colors.text },
  featWhat: { fontSize: typeSize.meta, lineHeight: 17, minHeight: 34, color: colors.muted },
  featMeta: { fontSize: typeSize.caption, fontWeight: "600", color: colors.text, fontVariant: ["tabular-nums"] },
  stripHit: { width: 120 },
  stripSkeleton: { aspectRatio: 0.82, borderRadius: radius.card, backgroundColor: colors.neutralSurface },
  stripCard: {
    overflow: "hidden",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  stripPhoto: { width: "100%", aspectRatio: 1, backgroundColor: colors.paper },
  photoImg: { width: "100%", height: "100%" },
  photoFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  initial: { fontSize: typeSize.title, fontWeight: "700", color: colors.onPrimary },
  initialLg: { fontSize: typeSize.largeTitle, fontWeight: "700", color: colors.onPrimary },
  stripCaption: { paddingHorizontal: 8, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  stripName: { fontSize: typeSize.caption, fontWeight: "600", color: colors.text },
  gridHit: { width: "48.5%", marginBottom: 12 },
  dirCaption: { paddingHorizontal: 10, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  dirNameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  dirName: { flexShrink: 1, fontSize: typeSize.meta, fontWeight: "600", color: colors.text },
  rating: { marginTop: 2, fontSize: typeSize.caption, fontWeight: "600", color: colors.muted },
  hint: { marginTop: 4, fontSize: typeSize.caption, fontWeight: "500", color: colors.primary },
  svcHit: { width: "48.5%" },
  svcSkeleton: { height: 236, borderRadius: radius.card, backgroundColor: colors.fill },
  svcCard: { flex: 1, borderRadius: radius.card, overflow: "hidden", backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  svcMedia: { width: "100%", aspectRatio: 4 / 3, justifyContent: "space-between", overflow: "hidden" },
  svcGlyph: { position: "absolute", right: -6, bottom: -8, opacity: 0.35 },
  svcTags: { flexDirection: "row", flexWrap: "wrap", gap: 4, padding: 8 },
  svcTag: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(255,255,255,0.94)", borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
  svcTagText: { fontSize: typeSize.caption, fontWeight: "700", color: colors.text },
  svcBody: { flex: 1, padding: 10, gap: 6 },
  svcTitle: { fontSize: typeSize.label, fontWeight: "700", lineHeight: 19, letterSpacing: -0.2, color: colors.text, minHeight: 38 },
  svcFoot: { marginTop: "auto", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  svcPrice: { flexShrink: 1, minWidth: 0 },
  book: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.selected },
  bookText: { fontSize: typeSize.meta, fontWeight: "700", color: colors.onSelected },
  expertRow: { marginTop: 2, flexDirection: "row", alignItems: "center", gap: 6, minWidth: 0 },
  expertName: { flexShrink: 1, minWidth: 0, fontSize: typeSize.caption, fontWeight: "500", color: colors.text },
  priceRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", gap: 4 },
  pricePrefix: { fontSize: typeSize.caption, fontWeight: "500", color: colors.muted },
  price: { fontSize: typeSize.label, fontWeight: "700", color: colors.text },
  priceSuffix: { fontSize: typeSize.caption, fontWeight: "500", color: colors.muted },
})
