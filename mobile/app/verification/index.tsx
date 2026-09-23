import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { ChevronRight, House, IdCard } from "lucide-react-native"
import { ScreenScroll } from "@/components/screen"
import { useAuth } from "@/lib/auth-context"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useKycSubmissions } from "@/lib/use-kyc-submissions"
import { useBitbankerEligibility } from "@/lib/use-bitbanker-eligibility"
import { ShieldCheck } from "lucide-react-native"
import { colors, radius, type as typeSize } from "@/lib/theme"

function StatusBadge({ status, t }: { status?: string; t: (key: string) => string }) {
  const label = !status
    ? t("verification.notStarted")
    : status === "approved"
      ? t("verification.badgeDone")
      : status === "in_review"
        ? t("verification.badgeInReview")
        : status === "rejected"
          ? t("verification.badgeRejected")
          : t("verification.badgePending")
  const tone = !status ? "neutral" : status === "approved" ? "success" : status === "rejected" ? "danger" : "pending"
  return (
    <View style={[styles.badge, styles[`badge_${tone}` as const]]}>
      <Text style={[styles.badgeText, styles[`badgeText_${tone}` as const]]}>{label}</Text>
    </View>
  )
}

export default function VerificationHubScreen() {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { user } = useAuth()
  const { data, loading, revalidate } = useKycSubmissions(user?.id)
  const { data: bitbankerEligibility } = useBitbankerEligibility(user?.id)
  const submissions = data || []

  useFocusRevalidate(revalidate)

  const identity = submissions.find((s) => s.type === "identity")
  const address = submissions.find((s) => s.type === "address")
  const bothApproved = identity?.status === "approved" && address?.status === "approved"

  if (loading) {
    return (
      <ScreenScroll edges={["left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenScroll>
    )
  }

  return (
    <ScreenScroll edges={["left", "right"]}>
      <Text style={styles.subtitle}>{t("verification.hubSubtitle")}</Text>

      <View style={styles.infoSend}>
        <Text style={styles.infoSendText}>{t("verification.sendGateNotice")}</Text>
      </View>

      {!bothApproved ? (
        <View style={styles.info}>
          <Text style={styles.infoText}>{t("verification.infoKyc")}</Text>
        </View>
      ) : null}

      <Pressable onPress={() => router.push("/verification/bitbanker")} style={styles.card}>
        <View style={styles.cardIcon}>
          <ShieldCheck size={20} color={colors.primary} strokeWidth={2} />
        </View>
        <Text style={styles.cardTitle}>{t("verification.sbpCardTitle")}</Text>
        <Text style={styles.cardDesc}>{t("verification.sbpCardDesc")}</Text>
        <View style={styles.cardFoot}>
          <StatusBadge
            status={bitbankerEligibility?.isVerifiedForSbp ? "approved" : bitbankerEligibility?.status === "checking" ? "in_review" : undefined}
            t={t}
          />
          <ChevronRight size={18} color={colors.muted} />
        </View>
      </Pressable>

      <Pressable onPress={() => router.push("/verification/identity")} style={styles.card}>
        <View style={styles.cardIcon}>
          <IdCard size={20} color={colors.primary} strokeWidth={2} />
        </View>
        <Text style={styles.cardTitle}>{t("verification.identityTitle")}</Text>
        <Text style={styles.cardDesc}>{t("verification.identityCardDesc")}</Text>
        <View style={styles.cardFoot}>
          <StatusBadge status={identity?.status} t={t} />
          <ChevronRight size={18} color={colors.muted} />
        </View>
      </Pressable>

      <Pressable onPress={() => router.push("/verification/address")} style={styles.card}>
        <View style={styles.cardIcon}>
          <House size={20} color={colors.primary} strokeWidth={2} />
        </View>
        <Text style={styles.cardTitle}>{t("verification.addressInformation")}</Text>
        <Text style={styles.cardDesc}>{t("verification.addressCardDesc")}</Text>
        <View style={styles.cardFoot}>
          <StatusBadge status={address?.status} t={t} />
          <ChevronRight size={18} color={colors.muted} />
        </View>
      </Pressable>
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  center: { paddingVertical: 80, alignItems: "center" },
  subtitle: { marginBottom: 16, fontSize: typeSize.body, lineHeight: 22, color: colors.muted },
  info: {
    marginBottom: 20,
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    padding: 14,
  },
  infoText: { fontSize: typeSize.meta, lineHeight: 19, color: "#1D4ED8" },
  infoSend: {
    marginBottom: 16,
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: "#FDE68A",
    backgroundColor: "#FFFBEB",
    padding: 14,
  },
  infoSendText: { fontSize: typeSize.meta, lineHeight: 19, color: "#92400E" },
  card: {
    marginBottom: 16,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 18,
  },
  cardIcon: {
    width: 44,
    height: 44,
    marginBottom: 12,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.heroBody,
  },
  cardTitle: { marginBottom: 4, fontSize: 16, fontWeight: "600", color: colors.text },
  cardDesc: { fontSize: typeSize.meta, lineHeight: 19, color: colors.muted },
  cardFoot: { marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  badge_neutral: { backgroundColor: "#F3F4F6" },
  badgeText_neutral: { color: "#374151" },
  badge_success: { backgroundColor: "#DCFCE7" },
  badgeText_success: { color: "#15803D" },
  badge_pending: { backgroundColor: "#FEF3C7" },
  badgeText_pending: { color: "#A16207" },
  badge_danger: { backgroundColor: "#FEE2E2" },
  badgeText_danger: { color: "#B91C1C" },
})
