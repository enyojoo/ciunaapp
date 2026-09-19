import { Pressable, StyleSheet, Text, View } from "react-native"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { BadgeCheck } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { formatCardPrice } from "@/lib/money"
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

export function ExpertFeaturedChip({ expert }: { expert: ExpertProfile }) {
  const router = useRouter()
  return (
    <Pressable
      onPress={() => router.push(expertProfilePath(expert) as never)}
      accessibilityRole="button"
      accessibilityLabel={expert.display_name}
      style={styles.stripHit}
    >
      <View style={styles.stripCard}>
        <View style={styles.stripPhoto}>
          {expert.image_url ? (
            <Image source={{ uri: expert.image_url }} style={styles.photoImg} contentFit="cover" />
          ) : (
            <View style={styles.photoFallback}>
              <Text style={styles.initial}>{(expert.display_name.trim().charAt(0) || "?").toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={styles.stripCaption}>
          <Text style={styles.stripName} numberOfLines={1} ellipsizeMode="tail">
            {expert.display_name}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

export function ExpertFeaturedSkeleton() {
  return <View style={[styles.stripHit, styles.stripSkeleton]} />
}

export function ExpertDirectoryCard({ expert }: { expert: ExpertProfile }) {
  const router = useRouter()
  return (
    <Pressable
      onPress={() => router.push(expertProfilePath(expert) as never)}
      accessibilityRole="button"
      accessibilityLabel={expert.display_name}
      style={styles.gridHit}
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
          <Text style={styles.dirName} numberOfLines={1} ellipsizeMode="tail">
            {expert.display_name}
          </Text>
          {expert.pricing_hint ? (
            <Text style={styles.hint} numberOfLines={1}>
              {expert.pricing_hint}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  )
}

export function ExpertServiceCard({
  service,
  showExpert = true,
  showTypicalSession = false,
}: {
  service: ExpertCatalogService
  showExpert?: boolean
  showTypicalSession?: boolean
}) {
  const { t } = useTranslation("app")
  const router = useRouter()
  const columns = useCatalogGridColumns()
  const expert = service.expert
  const minutes = service.default_duration_minutes
  const profileHref = expertProfilePath(expert)
  const detailHref = expertServicePath(service.id)
  const bookHref = expertBookPath(service.id)
  const bookLabel = t("experts.profile.bookSession", { defaultValue: "Book a session" })

  const openDetail = () => {
    seedExpertCatalogService(service)
    router.push(detailHref as never)
  }

  return (
    <View style={[styles.svcHit, { width: catalogCardWidth(columns) }]}>
      <Pressable
        onPress={openDetail}
        accessibilityRole="button"
        accessibilityLabel={service.title}
        style={styles.svcCard}
      >
        <View style={styles.svcTop}>
          <Text style={styles.svcTitle} numberOfLines={1} ellipsizeMode="tail">
            {service.title}
          </Text>
          {showTypicalSession && minutes != null && Number(minutes) > 0 ? (
            <Text style={styles.svcMeta}>
              {t("experts.profile.typicalSession", {
                defaultValue: "Typical session: {{minutes}} min",
                minutes: String(minutes),
              })}
            </Text>
          ) : null}
          {showExpert ? (
            <Pressable
              onPress={() => router.push(profileHref as never)}
              style={styles.expertRow}
              accessibilityRole="button"
              accessibilityLabel={expert.display_name}
            >
              {expert.image_url ? (
                <Image source={{ uri: expert.image_url }} style={styles.expertPhoto} contentFit="cover" />
              ) : (
                <View style={styles.expertFallback}>
                  <Text style={styles.expertInitial}>{(expert.display_name.trim().charAt(0) || "?").toUpperCase()}</Text>
                </View>
              )}
              <Text style={styles.expertName} numberOfLines={1}>
                {expert.display_name}
              </Text>
              {expert.is_verified ? (
                <BadgeCheck
                  size={14}
                  color={colors.primary}
                  strokeWidth={2.2}
                  accessibilityLabel={t("hub.expertVerified", { defaultValue: "Verified expert" })}
                />
              ) : null}
            </Pressable>
          ) : null}
        </View>
        <View style={styles.svcBottom}>
          <ServicePriceRow service={service} />
          <Pressable
            onPress={() => router.push(bookHref as never)}
            accessibilityRole="button"
            accessibilityLabel={bookLabel}
          >
            <View style={styles.cta}>
              <Text style={styles.ctaText}>{bookLabel}</Text>
            </View>
          </Pressable>
        </View>
      </Pressable>
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
        <Text style={styles.pricePrefix}>{t("experts.profile.priceFrom", { defaultValue: "From" })}</Text>
        <Text style={styles.price}>{formatCardPrice(s.hourly_rate, s.hourly_currency)}</Text>
        <Text style={styles.priceSuffix}>/ hr</Text>
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
  stripHit: { width: 120 },
  stripSkeleton: { aspectRatio: 0.82, borderRadius: radius.card, backgroundColor: "#F3F4F6" },
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
  initial: { fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
  initialLg: { fontSize: 28, fontWeight: "700", color: "#FFFFFF" },
  stripCaption: { paddingHorizontal: 8, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  stripName: { fontSize: 12, fontWeight: "600", color: colors.text },
  gridHit: { width: "48.5%", marginBottom: 12 },
  dirCaption: { paddingHorizontal: 10, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  dirName: { fontSize: typeSize.meta, fontWeight: "600", color: colors.text },
  hint: { marginTop: 4, fontSize: 11, fontWeight: "500", color: colors.primary },
  svcHit: { width: "48.5%" },
  svcSkeleton: { minHeight: 176, borderRadius: radius.card, backgroundColor: "#F3F4F6" },
  svcCard: {
    minHeight: 176,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: colors.surface,
    padding: 12,
    ...shadow({ opacity: 0.08, radius: 10, offsetY: 4, elevation: 2 }),
  },
  svcTop: { gap: 6, flexGrow: 1, marginBottom: 10 },
  svcTitle: { fontSize: 15, fontWeight: "700", lineHeight: 20, letterSpacing: -0.2, color: colors.text },
  svcMeta: { fontSize: 11, color: colors.muted },
  expertRow: { marginTop: 2, flexDirection: "row", alignItems: "center", gap: 6, minWidth: 0 },
  expertPhoto: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.paper },
  expertFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  expertInitial: { fontSize: 10, fontWeight: "700", color: colors.muted },
  expertName: { flexShrink: 1, minWidth: 0, fontSize: 11, fontWeight: "500", color: colors.text },
  svcBottom: { gap: 8 },
  priceRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", gap: 4 },
  pricePrefix: { fontSize: 11, fontWeight: "500", color: colors.muted },
  price: { fontSize: 15, fontWeight: "700", color: colors.text },
  priceSuffix: { fontSize: 11, fontWeight: "500", color: colors.muted },
  cta: {
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  ctaText: { fontSize: 12, fontWeight: "600", color: "#FFFFFF" },
})
