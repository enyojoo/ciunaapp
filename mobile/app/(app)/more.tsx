import { useEffect, useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import {
  BadgeCheck,
  FileText,
  Gift,
  Heart,
  Landmark,
  MessageCircleQuestion,
  Lock,
  LogOut,
  ShieldCheck,
  Gauge,
} from "lucide-react-native"
import { ScreenScroll } from "@/components/screen"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Avatar } from "@/components/avatar"
import { GroupCard, Row } from "@/components/row"
import { LanguagePicker } from "@/components/language-picker"
import { useAuth } from "@/lib/auth-context"
import { hasPin } from "@/lib/pin"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useBitbankerEligibility } from "@/lib/use-bitbanker-eligibility"
import { colors, radius, type as typeSize, ui } from "@/lib/theme"

export default function MoreScreen() {
  const { t } = useTranslation("common")
  const { t: tApp } = useTranslation("app")
  const { signOut, profile, user } = useAuth()
  const router = useRouter()
  const [pinSet, setPinSet] = useState(false)
  const [confirmOut, setConfirmOut] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
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

  const confirmSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
    } finally {
      setSigningOut(false)
      setConfirmOut(false)
    }
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
            {verified ? <BadgeCheck size={18} color={colors.success} strokeWidth={2.4} /> : null}
          </View>
          {profile?.email ? (
            <Text style={[ui.subtitle, styles.email]} numberOfLines={1}>
              {profile.email}
            </Text>
          ) : null}
        </View>
        <View style={styles.openChip}>
          <Text style={styles.openChipText}>{t("more.profile", { defaultValue: "Profile" })}</Text>
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
          icon={<Gauge size={16} color={colors.primaryDeep} strokeWidth={2.2} />}
          label={tApp("limits.title", { defaultValue: "Limits" })}
          onPress={() => router.push("/limits" as never)}
        />
        <Row
          icon={<Gift size={16} color={colors.refer} strokeWidth={2.2} />}
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
          icon={<Heart size={16} color={colors.primaryDeep} strokeWidth={2.2} />}
          label={tApp("favourites.title", { defaultValue: "Favourites" })}
          onPress={() => router.push("/favourites" as never)}
        />
        <Row
          icon={<Landmark size={16} color={colors.primaryDeep} strokeWidth={2.2} />}
          label={t("more.recipients")}
          onPress={() => router.push("/recipients")}
        />
        <Row
          icon={<MessageCircleQuestion size={16} color={colors.primaryDeep} strokeWidth={2.2} />}
          label={t("more.support")}
          onPress={() => router.push("/support")}
        />
        <Row
          icon={<FileText size={16} color={colors.primaryDeep} strokeWidth={2.2} />}
          label={t("more.legal", { defaultValue: "Legal" })}
          onPress={() => router.push("/legal" as never)}
          last
        />
      </GroupCard>

      <Pressable onPress={() => router.push("/delete-account" as never)} style={styles.deleteLink}>
        <Text style={styles.deleteText}>{tApp("more.deleteAccount", { defaultValue: "Delete account" })}</Text>
      </Pressable>

      <Pressable onPress={() => setConfirmOut(true)} style={styles.logout}>
        <LogOut size={16} color={colors.danger} strokeWidth={2.2} />
        <Text style={styles.logoutText}>{t("more.logout")}</Text>
      </Pressable>
      <Text style={styles.version}>{t("more.version", { version: "1.0.0" })}</Text>
      <ConfirmDialog
        open={confirmOut}
        title={t("more.signOutTitle")}
        description={t("more.signOutDescription")}
        confirmLabel={t("more.signOut")}
        cancelLabel={t("more.cancel")}
        destructive
        busy={signingOut}
        onConfirm={() => void confirmSignOut()}
        onCancel={() => setConfirmOut(false)}
      />
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
  deleteLink: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  deleteText: { fontSize: 13, color: colors.muted, textDecorationLine: "underline" },
  logoutText: { fontWeight: "600", color: colors.danger },
  version: { marginTop: 8, textAlign: "center", fontSize: 13, color: colors.muted },
})
