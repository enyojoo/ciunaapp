import { useEffect, useMemo } from "react"
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native"
import { Image } from "expo-image"
import { StatusBar } from "expo-status-bar"
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { BadgeCheck } from "lucide-react-native"
import { EmptyState } from "@/components/empty-state"
import {
  ExpertServiceCard,
  ServicePriceRow,
  expertBookPath,
  expertProfilePath,
} from "@/components/expert-catalog"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { useExpertCatalogService, useExpertCatalogServices } from "@/lib/use-expert-catalog-services"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useRevalidateOnForeground } from "@/lib/use-revalidate-on-foreground"
import { colors, type as typeSize } from "@/lib/theme"

export default function ExpertServiceDetailScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>()
  const id = String(serviceId || "")
  const navigation = useNavigation()
  const router = useRouter()
  const { t } = useTranslation("app")
  const { data: service, loading, error, revalidate } = useExpertCatalogService(id)
  const catalog = useExpertCatalogServices()
  const notFound = !loading && (Boolean(error) || !service)

  useFocusRevalidate(revalidate)
  useRevalidateOnForeground(revalidate)

  useEffect(() => {
    navigation.setOptions({ title: "" })
  }, [navigation])

  const moreFromExpert = useMemo(() => {
    if (!service) return []
    return (catalog.data || []).filter((s) => s.id !== service.id && s.expert.id === service.expert.id)
  }, [catalog.data, service])

  if (loading) {
    return (
      <ScreenScroll edges={["left", "right"]}>
        <StatusBar style="dark" />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenScroll>
    )
  }

  if (notFound || !service) {
    return (
      <ScreenScroll edges={["left", "right"]}>
        <StatusBar style="dark" />
        <EmptyState
          title={t("hub.serviceUnavailable", { defaultValue: "This service is currently unavailable." })}
          actionLabel={t("hub.expertsAll", { defaultValue: "All experts" })}
          onAction={() => router.replace("/experts" as never)}
        />
      </ScreenScroll>
    )
  }

  const expert = service.expert
  const minutes = service.default_duration_minutes
  const desc = (service.short_description || "").trim()
  const bookLabel = t("experts.profile.bookSession", { defaultValue: "Book a session" })

  return (
    <ScreenScroll edges={["left", "right"]}>
      <StatusBar style="dark" />
      <Text style={styles.title}>{service.title}</Text>
      <Pressable
        onPress={() => router.push(expertProfilePath(expert) as never)}
        accessibilityRole="button"
        accessibilityLabel={expert.display_name}
        style={styles.expertHit}
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
            size={16}
            color={colors.primary}
            strokeWidth={2.2}
            accessibilityLabel={t("hub.expertVerified", { defaultValue: "Verified expert" })}
          />
        ) : null}
      </Pressable>

      {desc ? <Text style={styles.desc}>{desc}</Text> : null}
      {minutes != null && Number(minutes) > 0 ? (
        <Text style={styles.meta}>
          {t("experts.profile.typicalSession", {
            defaultValue: "Typical session: {{minutes}} min",
            minutes: String(minutes),
          })}
        </Text>
      ) : null}

      <View style={styles.priceBlock}>
        <ServicePriceRow service={service} />
      </View>

      <PrimaryButton label={bookLabel} onPress={() => router.push(expertBookPath(service.id) as never)} />

      {moreFromExpert.length > 0 ? (
        <View style={styles.more}>
          <Text style={styles.moreHeading}>
            {t("hub.cart.moreFromVendor", {
              defaultValue: "More from {{vendor}}",
              vendor: expert.display_name,
            })}
          </Text>
          <View style={styles.grid}>
            {moreFromExpert.map((s) => (
              <ExpertServiceCard key={s.id} service={s} />
            ))}
          </View>
        </View>
      ) : null}
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  center: { paddingVertical: 60, alignItems: "center" },
  title: { fontSize: 20, fontWeight: "600", color: colors.text },
  expertHit: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", maxWidth: "100%" },
  expertPhoto: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.paper },
  expertFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  expertInitial: { fontSize: 12, fontWeight: "700", color: colors.muted },
  expertName: { flexShrink: 1, fontSize: typeSize.body, fontWeight: "500", color: colors.text },
  desc: { marginTop: 14, fontSize: typeSize.body, lineHeight: 22, color: colors.text },
  meta: { marginTop: 10, fontSize: typeSize.meta, color: colors.muted },
  priceBlock: { marginTop: 20, marginBottom: 16 },
  more: { marginTop: 32 },
  moreHeading: { marginBottom: 14, fontSize: 18, fontWeight: "600", color: colors.text },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
})
