import { useEffect, useMemo, useState } from "react"
import { Alert, Pressable, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import {
  BadgeCheck,
  FileText,
  Gift,
  Landmark,
  LifeBuoy,
  Lock,
  LogOut,
  ShieldCheck,
} from "lucide-react-native"
import { ScreenScroll } from "@/components/screen"
import { Avatar } from "@/components/avatar"
import { GroupCard, Row } from "@/components/row"
import { LanguagePicker } from "@/components/language-picker"
import { useAuth } from "@/lib/auth-context"
import { useExternalLink } from "@/lib/external-link"
import { hasPin } from "@/lib/pin"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useBitbankerEligibility } from "@/lib/use-bitbanker-eligibility"
import { colors, radius, type as typeSize, ui } from "@/lib/theme"

export default function MoreScreen() {
  const { t } = useTranslation("common")
  const { signOut, profile, user } = useAuth()
  const { openLink } = useExternalLink()
  const router = useRouter()
  const [pinSet, setPinSet] = useState(false)
  const { data: eligibility, revalidate } = useBitbankerEligibility(user?.id)

  useFocusRevalidate(() => void revalidate())

  useEffect(() => {
    if (!user) return
    void hasPin(user.id).then(setPinSet)
  }, [user])

  const verified = eligibility?.isVerifiedForSbp ?? false

  const kycLabel = useMemo(() => {
    if (eligibility?.isVerifiedForSbp) return t("kyc.verified")
    if (eligibility?.status === "checking") return t("kyc.inReview")
    if (eligibility?.status === "not_verified") return t("kyc.rejected")
    if (eligibility?.status === "unavailable") return t("kyc.pending")
    return t("kyc.takeAction")
  }, [eligibility, t])

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
      <Text style={styles.title}>{t("more.title", { defaultValue: "More" })}</Text>

      <Pressable onPress={() => router.push("/profile")} style={styles.identity}>
        <Avatar name={name} size={60} uri={profile?.avatar_url} />
        <View style={styles.identityBody}>
          <View style={styles.nameRow}>
            <Text style={[ui.title, styles.name]} numberOfLines={1}>
              {name}
            </Text>
            {verified ? <BadgeCheck size={18} color={colors.primary} strokeWidth={2.4} /> : null}
          </View>
          {profile?.email ? (
            <Text style={[ui.subtitle, styles.email]} numberOfLines={1}>
              {profile.email}
            </Text>
          ) : null}
        </View>
        <View style={styles.openChip}>
          <Text style={styles.openChipText}>{t("more.open", { defaultValue: "Open" })}</Text>
        </View>
      </Pressable>

      <GroupCard title={t("more.account")}>
        <Row
          icon={<ShieldCheck size={16} color={colors.primaryDeep} strokeWidth={2.2} />}
          label={t("more.accountVerification")}
          onPress={() => router.push("/verification")}
          trailing={
            <View style={[styles.badge, verified && styles.badgeVerified]}>
              <Text style={[styles.badgeText, verified && styles.badgeTextVerified]}>{kycLabel}</Text>
            </View>
          }
        />
        <Row
          icon={<Gift size={16} color={colors.primaryDeep} strokeWidth={2.2} />}
          label={t("more.affiliatesReferrals")}
          onPress={() => router.push("/referrals")}
        />
        <Row
          icon={<Lock size={16} color={colors.primaryDeep} strokeWidth={2.2} />}
          label={t("more.loginPin")}
          onPress={() => router.push(pinSet ? "/pin-setup?mode=change" : "/pin-setup?mode=create")}
          last
        />
      </GroupCard>

      <GroupCard title={t("more.app")}>
        <LanguagePicker />
        <Row
          icon={<Landmark size={16} color={colors.primaryDeep} strokeWidth={2.2} />}
          label={t("more.recipients")}
          onPress={() => router.push("/recipients")}
        />
        <Row
          icon={<LifeBuoy size={16} color={colors.primaryDeep} strokeWidth={2.2} />}
          label={t("more.support")}
          onPress={() => router.push("/support")}
        />
        <Row
          icon={<FileText size={16} color={colors.primaryDeep} strokeWidth={2.2} />}
          label={t("more.privacyPolicy")}
          onPress={() => void openLink("https://www.ciuna.com/privacy", t("more.privacyPolicy"))}
        />
        <Row
          icon={<FileText size={16} color={colors.primaryDeep} strokeWidth={2.2} />}
          label={t("more.termsOfService")}
          onPress={() => void openLink("https://www.ciuna.com/terms", t("more.termsOfService"))}
          last
        />
      </GroupCard>

      <Pressable onPress={confirmSignOut} style={styles.logout}>
        <LogOut size={16} color={colors.danger} strokeWidth={2.2} />
        <Text style={styles.logoutText}>{t("more.logout")}</Text>
      </Pressable>
      <Text style={styles.version}>{t("more.version", { version: "1.0.0" })}</Text>
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  title: { paddingTop: 4, paddingBottom: 4, fontSize: 24, fontWeight: "700", color: colors.text },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
    marginTop: 8,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
  },
  identityBody: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 18, marginBottom: 1 },
  email: { fontSize: typeSize.meta, marginTop: 0 },
  openChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginLeft: 8,
    minHeight: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.heroBody,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  openChipText: { fontSize: 13, fontWeight: "700", color: colors.primaryDeep },
  badge: {
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeVerified: { backgroundColor: colors.referBg },
  badgeText: { fontSize: 12, fontWeight: "600", color: colors.muted },
  badgeTextVerified: { color: colors.refer },
  logout: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  logoutText: { fontWeight: "600", color: colors.danger },
  version: { marginTop: 8, textAlign: "center", fontSize: 13, color: colors.muted },
})
