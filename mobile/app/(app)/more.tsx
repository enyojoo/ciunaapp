import { useEffect, useMemo, useState } from "react"
import { Alert, Pressable, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { ScreenScroll } from "@/components/screen"
import { GroupCard, Row } from "@/components/row"
import { LanguagePicker } from "@/components/language-picker"
import { fetchWithAuth } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useExternalLink } from "@/lib/external-link"
import { hasPin } from "@/lib/pin"
import { colors, radius, ui } from "@/lib/theme"

type KycRow = { type?: string; status?: string }

export default function MoreScreen() {
  const { t } = useTranslation("common")
  const { signOut, profile, user } = useAuth()
  const { openLink } = useExternalLink()
  const router = useRouter()
  const [pinSet, setPinSet] = useState(false)
  const [kyc, setKyc] = useState<KycRow[]>([])

  useEffect(() => {
    if (!user) return
    void hasPin(user.id).then(setPinSet)
    void (async () => {
      const res = await fetchWithAuth("/api/kyc/submissions")
      if (!res.ok) return
      const body = (await res.json()) as { submissions?: KycRow[] }
      setKyc(body.submissions || [])
    })()
  }, [user])

  const kycLabel = useMemo(() => {
    const identity = kyc.find((s) => s.type === "identity")
    const address = kyc.find((s) => s.type === "address")
    if (identity?.status === "approved" && address?.status === "approved") return t("kyc.verified")
    if (identity?.status === "in_review" || address?.status === "in_review") return t("kyc.inReview")
    if (identity?.status === "rejected" || address?.status === "rejected") return t("kyc.rejected")
    if (identity || address) return t("kyc.pending")
    return t("kyc.takeAction")
  }, [kyc, t])

  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Account"

  const confirmSignOut = () => {
    Alert.alert(t("more.signOutTitle"), t("more.signOutDescription"), [
      { text: t("more.cancel"), style: "cancel" },
      {
        text: t("more.signOut"),
        style: "destructive",
        onPress: () => void signOut(),
      },
    ])
  }

  return (
    <ScreenScroll>
      <View style={styles.identity}>
        <Text style={ui.title}>{name}</Text>
        {profile?.email ? <Text style={ui.subtitle}>{profile.email}</Text> : null}
      </View>

      <GroupCard title={t("more.account")}>
        <Row label={t("more.yourProfile")} onPress={() => router.push("/profile")} />
        <Row
          label={t("more.accountVerification")}
          onPress={() => router.push("/verification")}
          trailing={
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{kycLabel}</Text>
            </View>
          }
        />
        <Row label={t("more.affiliatesReferrals")} onPress={() => router.push("/referrals")} />
        <Row
          label={t("more.loginPin")}
          onPress={() => router.push(pinSet ? "/pin-setup?mode=change" : "/pin-setup?mode=create")}
          last
        />
      </GroupCard>

      <GroupCard title={t("more.app")}>
        <LanguagePicker />
        <Row label={t("more.recipients")} onPress={() => router.push("/recipients")} />
        <Row label={t("more.support")} onPress={() => router.push("/support")} />
        <Row
          label={t("more.privacyPolicy")}
          onPress={() => void openLink("https://www.ciuna.com/privacy", t("more.privacyPolicy"))}
        />
        <Row
          label={t("more.termsOfService")}
          onPress={() => void openLink("https://www.ciuna.com/terms", t("more.termsOfService"))}
          last
        />
      </GroupCard>

      <Pressable onPress={confirmSignOut} style={styles.logout}>
        <Text style={styles.logoutText}>{t("more.logout")}</Text>
      </Pressable>
      <Text style={styles.version}>{t("more.version", { version: "1.0.0" })}</Text>
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  identity: { marginBottom: 20, paddingTop: 8 },
  badge: {
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 12, fontWeight: "600", color: colors.muted },
  logout: { minHeight: 48, alignItems: "center", paddingVertical: 12 },
  logoutText: { fontWeight: "600", color: colors.danger },
  version: { marginTop: 8, textAlign: "center", fontSize: 13, color: colors.muted },
})
