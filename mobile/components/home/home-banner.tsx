import { StyleSheet, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { AppText, Card, Icon, IconWell, type IconName } from "@/components/ui"
import { useAuth } from "@/lib/auth-context"
import { useBitbankerEligibility } from "@/lib/use-bitbanker-eligibility"
import { colors, space } from "@/lib/theme"

type Pick = { id: "verify" | "review" | "refer"; icon: IconName; href: string; tint: string; fg: string }

/**
 * One banner slot, chosen by relevance, never a carousel: finish verification, then verification in review,
 * then the referral invite. Renders nothing while verification status is still loading.
 */
export function HomeBanner() {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { user } = useAuth()
  const { data } = useBitbankerEligibility(user?.id)
  if (!data) return null
  const pick: Pick =
    data.isVerifiedForSbp
      ? { id: "refer", icon: "gift", href: "/referrals", tint: colors.referBg, fg: colors.refer }
      : data.status === "checking"
        ? { id: "review", icon: "clock", href: "/verification", tint: colors.warningSurface, fg: colors.warningText }
        : { id: "verify", icon: "shield", href: "/verification", tint: colors.primaryTint, fg: colors.primaryText }
  const title = t(`home.banner.${pick.id}.title`)
  return (
    <View style={styles.wrap}>
      <Card onPress={() => router.push(pick.href as never)} accessibilityLabel={title} style={[styles.card, { backgroundColor: pick.tint }]}>
        <IconWell size={44} tone="surface">
          <Icon name={pick.icon} size={22} color={pick.fg} />
        </IconWell>
        <View style={styles.body}>
          <AppText variant="bodyStrong" numberOfLines={2}>
            {title}
          </AppText>
          <AppText variant="meta" tone="muted" numberOfLines={2}>
            {t(`home.banner.${pick.id}.body`)}
          </AppText>
        </View>
        <Icon name="chevronRight" size={16} color={colors.subtle} />
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.gutter, marginBottom: space.lg },
  card: { flexDirection: "row", alignItems: "center", gap: space.md, borderColor: "transparent" },
  body: { flex: 1, minWidth: 0, gap: 2 },
})
