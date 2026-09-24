import { StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Clock, House, IdCard, ShieldCheck } from "lucide-react-native"
import { ScreenScroll } from "@/components/screen"
import { GroupCard, Row } from "@/components/row"
import { PrimaryButton } from "@/components/primary-button"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useAuth } from "@/lib/auth-context"
import { useBitbankerEligibility } from "@/lib/use-bitbanker-eligibility"
import { colors, radius, type as typeSize } from "@/lib/theme"

type HubStatus = "verified" | "checking" | "needed"

function StatusHero({ status, t }: { status: HubStatus; t: (key: string) => string }) {
  const verified = status === "verified"
  const checking = status === "checking"

  const icon = verified ? (
    <ShieldCheck size={28} color={colors.refer} strokeWidth={2.2} />
  ) : checking ? (
    <Clock size={28} color="#B45309" strokeWidth={2.2} />
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

  useFocusRevalidate(() => void revalidate())

  const verified = eligibility?.isVerifiedForSbp
  const checking = eligibility?.status === "checking" && !verified
  const status: HubStatus = verified ? "verified" : checking ? "checking" : "needed"

  return (
    <ScreenScroll edges={["left", "right"]}>
      <StatusHero status={status} t={t} />

      {status === "needed" ? (
        <View style={styles.primaryAction}>
          <PrimaryButton
            label={t("verification.hubContinueCta")}
            onPress={() => router.push("/verification/bitbanker")}
          />
        </View>
      ) : null}

      {status === "verified" ? (
        <View style={styles.primaryAction}>
          <PrimaryButton
            label={t("verification.bitbanker.goToSend")}
            onPress={() => router.replace("/send" as never)}
          />
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>{t("verification.optionalSection")}</Text>
      <GroupCard>
        <Row
          icon={<IdCard size={16} color={colors.primaryDeep} strokeWidth={2.2} />}
          label={t("verification.identityTitle")}
          onPress={() => router.push("/verification/identity")}
        />
        <Row
          icon={<House size={16} color={colors.primaryDeep} strokeWidth={2.2} />}
          label={t("verification.addressInformation")}
          onPress={() => router.push("/verification/address")}
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
    borderColor: "#FDE68A",
    backgroundColor: "#FFFBEB",
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
  statusIconVerified: { backgroundColor: "#D1FAE5" },
  statusIconPending: { backgroundColor: "#FEF3C7" },
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
  primaryAction: { marginBottom: 28 },
  sectionLabel: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.35,
    textTransform: "uppercase",
    color: colors.muted,
  },
})
