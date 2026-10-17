import { Pressable, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Clock, House, IdCard, ShieldCheck } from "lucide-react-native"
import { ScreenScroll } from "@/components/screen"
import { GroupCard, Row } from "@/components/row"
import { PrimaryButton } from "@/components/primary-button"
import { BitbankerKycBridge } from "@/components/bitbanker-kyc-bridge"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useAuth } from "@/lib/auth-context"
import { useBitbankerEligibility } from "@/lib/use-bitbanker-eligibility"
import { useKycSubmissions, type KycSubmission } from "@/lib/use-kyc-submissions"
import { useCachedQuery } from "@/lib/use-cached-query"
import { authJson } from "@/lib/social-api"
import { formatCardPrice } from "@/lib/money"
import type { CurrentLimit } from "@/lib/limit-check"
import { colors, radius, type as typeSize } from "@/lib/theme"

type HubStatus = "verified" | "checking" | "needed"

function StatusHero({ status, t }: { status: HubStatus; t: (key: string) => string }) {
  const verified = status === "verified"
  const checking = status === "checking"

  const icon = verified ? (
    <ShieldCheck size={28} color={colors.refer} strokeWidth={2.2} />
  ) : checking ? (
    <Clock size={28} color={colors.warning} strokeWidth={2.2} />
  ) : (
    <ShieldCheck size={28} color={colors.primaryDeep} strokeWidth={2.2} />
  )

  const titleKey = verified
    ? "verification.hubStatusVerifiedTitle"
    : checking
      ? "verification.hubStatusPendingTitle"
      : "verification.hubStatusNeededTitle"
  const bodyKey = verified
    ? "verification.hubStatusVerifiedBody"
    : checking
      ? "verification.hubStatusPendingBody"
      : "verification.hubStatusNeededBody"

  return (
    <View
      style={[
        styles.statusCard,
        verified && styles.statusCardVerified,
        checking && styles.statusCardPending,
      ]}
    >
      <View
        style={[
          styles.statusIcon,
          verified && styles.statusIconVerified,
          checking && styles.statusIconPending,
        ]}
      >
        {icon}
      </View>
      <Text style={styles.statusTitle}>{t(titleKey)}</Text>
      <Text style={styles.statusBody}>{t(bodyKey)}</Text>
    </View>
  )
}

export default function VerificationHubScreen() {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { user } = useAuth()
  const { data: eligibility, revalidate } = useBitbankerEligibility(user?.id)

  const { data: subs, revalidate: revalidateSubs } = useKycSubmissions(user?.id)
  const { data: limitState } = useCachedQuery<{ current: (CurrentLimit & { level: number }) | null }>(user ? `ciuna_limits_${user.id}` : null, () => authJson("/api/limits"), { ttlMs: 60_000 })
  useFocusRevalidate(() => {
    void revalidate()
    void revalidateSubs()
  })

  const badgeFor = (type: KycSubmission["type"]) => {
    const s = (subs || []).filter((x) => x.type === type)[0]
    const status = s?.status
    if (status === "approved") return { text: t("kyc.verified", { ns: "common" }), bg: colors.successSurface, fg: colors.successText }
    if (status === "in_review" || status === "pending") return { text: t("kyc.inReview", { ns: "common" }), bg: colors.warningSurface, fg: colors.warningText }
    if (status === "rejected") return { text: t("kyc.rejected", { ns: "common" }), bg: colors.dangerSurface, fg: colors.dangerText }
    return { text: t("verification.notStarted", { defaultValue: "Not started" }), bg: colors.neutralSurface, fg: colors.neutralText }
  }
  const idBadge = badgeFor("identity")
  const addrBadge = badgeFor("address")
  const cur = limitState?.current

  const verified = eligibility?.isVerifiedForSbp
  const checking = eligibility?.status === "checking" && !verified
  const status: HubStatus = verified ? "verified" : checking ? "checking" : "needed"

  return (
    <ScreenScroll edges={["left", "right"]}>
      <StatusHero status={status} t={t} />

      {status === "needed" || status === "checking" ? (
        <BitbankerKycBridge
          ui="minimal"
          onVerified={() => void revalidate()}
          renderTrigger={({ onPress, loading, label }) => (
            <View style={styles.primaryAction}>
              <PrimaryButton label={label} onPress={onPress} busy={loading} />
            </View>
          )}
        />
      ) : null}

      {status === "verified" ? (
        <View style={styles.primaryAction}>
          <PrimaryButton
            label={t("verification.bitbanker.goToSend")}
            onPress={() => router.replace("/send" as never)}
          />
        </View>
      ) : null}

      {cur ? (
        <Pressable onPress={() => router.push("/limits" as never)} accessibilityRole="button" style={styles.limitCard}>
          <View style={styles.limitText}>
            <Text style={styles.limitTitle}>{t("verification.yourLimit", { defaultValue: "Your monthly limit" })}</Text>
            <Text style={styles.limitSub}>
              {t("verification.limitLeft", { left: formatCardPrice(cur.remaining, cur.currency), total: formatCardPrice(cur.monthly_amount, cur.currency), defaultValue: "{{left}} left of {{total}}" })}
            </Text>
          </View>
          <Text style={styles.limitLink}>{t("send.seeLimits", { defaultValue: "See limits" })}</Text>
        </Pressable>
      ) : null}

      <Text style={styles.sectionLabel}>{t("verification.optionalSection")}</Text>
      <GroupCard>
        <Row
          icon={<IdCard size={16} color={colors.primaryDeep} strokeWidth={2.2} />}
          label={t("verification.identityTitle")}
          onPress={() => router.push("/verification/identity")}
          trailing={<View style={[styles.badge, { backgroundColor: idBadge.bg }]}><Text style={[styles.badgeText, { color: idBadge.fg }]}>{idBadge.text}</Text></View>}
        />
        <Row
          icon={<House size={16} color={colors.primaryDeep} strokeWidth={2.2} />}
          label={t("verification.addressInformation")}
          onPress={() => router.push("/verification/address")}
          trailing={<View style={[styles.badge, { backgroundColor: addrBadge.bg }]}><Text style={[styles.badgeText, { color: addrBadge.fg }]}>{addrBadge.text}</Text></View>}
          last
        />
      </GroupCard>
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  statusCard: {
    marginTop: 4,
    marginBottom: 20,
    alignItems: "center",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  statusCardVerified: {
    borderColor: colors.referBorder,
    backgroundColor: colors.referBg,
  },
  statusCardPending: {
    borderColor: colors.warningBorder,
    backgroundColor: colors.warningSurface,
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.heroBody,
    marginBottom: 14,
  },
  statusIconVerified: { backgroundColor: colors.successSurface },
  statusIconPending: { backgroundColor: colors.warningSurface },
  statusTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  statusBody: {
    marginTop: 8,
    fontSize: typeSize.meta,
    lineHeight: 20,
    color: colors.muted,
    textAlign: "center",
    maxWidth: 300,
  },
  primaryAction: { marginBottom: 20 },
  limitCard: { marginBottom: 24, flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, padding: 14, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  limitText: { flex: 1, minWidth: 0 },
  limitTitle: { fontSize: typeSize.body, fontWeight: "700", color: colors.text },
  limitSub: { marginTop: 2, fontSize: typeSize.meta, color: colors.muted },
  limitLink: { fontSize: typeSize.meta, fontWeight: "700", color: colors.primaryText },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  sectionLabel: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.35,
    textTransform: "uppercase",
    color: colors.muted,
  },
})
