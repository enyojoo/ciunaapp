import { type ReactNode, useEffect } from "react"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { useNavigation, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { CheckCircle2, Clock } from "lucide-react-native"
import { useAuth } from "@/lib/auth-context"
import { useBitbankerEligibility } from "@/lib/use-bitbanker-eligibility"
import { PrimaryButton } from "@/components/primary-button"
import { BitbankerVerificationForm } from "@/components/bitbanker-verification-form"
import { ScreenScroll } from "@/components/screen"
import { colors, radius, type as typeSize, ui } from "@/lib/theme"

function StateCard({
  tone,
  icon,
  title,
  body,
  action,
}: {
  tone: "success" | "pending"
  icon: ReactNode
  title: string
  body: string
  action?: ReactNode
}) {
  const success = tone === "success"
  return (
    <ScreenScroll edges={["left", "right"]}>
      <View style={[styles.stateCard, success ? styles.stateCardSuccess : styles.stateCardPending]}>
        <View style={[styles.stateIcon, success ? styles.stateIconSuccess : styles.stateIconPending]}>{icon}</View>
        <Text style={styles.stateTitle}>{title}</Text>
        <Text style={styles.stateBody}>{body}</Text>
      </View>
      {action ? <View style={styles.stateAction}>{action}</View> : null}
    </ScreenScroll>
  )
}

export default function BitbankerVerificationScreen() {
  const { t } = useTranslation("app")
  const navigation = useNavigation()
  const router = useRouter()
  const { user, userProfile } = useAuth()
  const { data, loading, revalidate } = useBitbankerEligibility(user?.id)

  useEffect(() => {
    navigation.setOptions({ title: t("verification.sbpFormTitle") })
  }, [navigation, t])

  const verified = data?.isVerifiedForSbp
  const checking = data?.status === "checking" && !verified

  if (loading && !data) {
    return (
      <ScreenScroll edges={["left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenScroll>
    )
  }

  if (verified) {
    return (
      <StateCard
        tone="success"
        icon={<CheckCircle2 size={32} color={colors.success} strokeWidth={2} />}
        title={t("verification.sbpSuccessTitle")}
        body={t("verification.sbpSuccessBody")}
        action={
          <PrimaryButton label={t("verification.bitbanker.goToSend")} onPress={() => router.replace("/send" as never)} />
        }
      />
    )
  }

  if (checking) {
    return (
      <StateCard
        tone="pending"
        icon={<Clock size={32} color="#B45309" strokeWidth={2} />}
        title={t("verification.hubStatusPendingTitle")}
        body={t("verification.sbpChecking")}
      />
    )
  }

  return (
    <ScreenScroll edges={["left", "right"]} keyboard>
      <Text style={ui.subtitle}>{t("verification.formLead")}</Text>
      <BitbankerVerificationForm
        defaultEmail={userProfile?.email ?? user?.email ?? ""}
        onSubmitted={() => void revalidate()}
      />
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  center: { paddingVertical: 80, alignItems: "center" },
  stateCard: {
    marginTop: 8,
    alignItems: "center",
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  stateCardSuccess: {
    borderColor: colors.referBorder,
    backgroundColor: colors.referBg,
  },
  stateCardPending: {
    borderColor: "#FDE68A",
    backgroundColor: "#FFFBEB",
  },
  stateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  stateIconSuccess: { backgroundColor: "#D1FAE5" },
  stateIconPending: { backgroundColor: "#FEF3C7" },
  stateTitle: { fontSize: 20, fontWeight: "700", color: colors.text, textAlign: "center" },
  stateBody: { marginTop: 8, fontSize: typeSize.body, lineHeight: 22, color: colors.muted, textAlign: "center" },
  stateAction: { marginTop: 24 },
})
