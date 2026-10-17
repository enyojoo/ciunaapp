import { useEffect, useMemo, useState } from "react"
import { StyleSheet, View } from "react-native"
import { useRouter } from "expo-router"
import Constants from "expo-constants"
import { useTranslation } from "react-i18next"
import { ScreenScroll } from "@/components/screen"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Avatar } from "@/components/avatar"
import { LanguagePicker } from "@/components/language-picker"
import { AppText, Badge, Icon, IconWell, ListGroup, ListRow, PressableScale, type BadgeTone, type IconName } from "@/components/ui"
import { useAuth } from "@/lib/auth-context"
import { hasPin } from "@/lib/pin"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useBitbankerEligibility } from "@/lib/use-bitbanker-eligibility"
import { colors, radius, space, type as typeSize } from "@/lib/theme"

function RowIcon({ name, tint }: { name: IconName; tint?: string }) {
  return (
    <IconWell>
      <Icon name={name} size={18} color={tint ?? colors.neutralText} />
    </IconWell>
  )
}

/** A square shortcut for the places people open most from Account. */
function Shortcut({ icon, label, onPress, tint, bg }: { icon: IconName; label: string; onPress: () => void; tint: string; bg: string }) {
  return (
    <PressableScale onPress={onPress} haptics accessibilityRole="button" accessibilityLabel={label} style={styles.shortcut}>
      <View style={[styles.shortcutIcon, { backgroundColor: bg }]}>
        <Icon name={icon} size={20} color={tint} />
      </View>
      <AppText variant="label" numberOfLines={1}>
        {label}
      </AppText>
    </PressableScale>
  )
}

export default function AccountScreen() {
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
  const inReview = eligibility?.status === "checking"

  const kycTone: BadgeTone = verified ? "success" : inReview ? "warning" : eligibility?.status === "not_verified" ? "danger" : "neutral"
  const kycLabel = useMemo(() => {
    if (verified) return t("kyc.verified")
    if (inReview) return t("kyc.inReview")
    if (eligibility?.status === "not_verified") return t("kyc.rejected")
    if (eligibility?.status === "unavailable") return t("kyc.pending")
    return t("kyc.takeAction")
  }, [eligibility, verified, inReview, t])

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
    <ScreenScroll contentStyle={styles.content}>
      <AppText variant="largeTitle" accessibilityRole="header" style={styles.title}>
        {t("nav.account", { defaultValue: "Account" })}
      </AppText>

      {/* Who you are, and whether you can send money yet. Tapping opens Profile. */}
      <PressableScale onPress={() => router.push("/profile")} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={name} style={styles.identity}>
        <View style={styles.avatarRing}>
          <Avatar name={name} size={72} uri={profile?.avatar_url} />
        </View>
        <View style={styles.nameRow}>
          <AppText variant="title" numberOfLines={1} style={styles.name}>
            {name}
          </AppText>
          {verified ? <Icon name="verified" size={20} color={colors.success} /> : null}
        </View>
        {profile?.email ? (
          <AppText variant="meta" tone="muted" numberOfLines={1}>
            {profile.email}
          </AppText>
        ) : null}
        <View style={styles.editPill}>
          <AppText variant="label" style={styles.editText}>
            {tApp("account.editProfile", { defaultValue: "Edit profile" })}
          </AppText>
        </View>
      </PressableScale>

      {!verified && !inReview ? (
        <PressableScale onPress={() => router.push("/verification")} scaleTo={0.985} accessibilityRole="button" style={styles.verify}>
          <View style={styles.verifyIcon}>
            <Icon name="shield" size={20} color={colors.primaryText} />
          </View>
          <View style={styles.verifyBody}>
            <AppText variant="bodyStrong">{tApp("home.banner.verify.title", { defaultValue: "Verify your identity" })}</AppText>
            <AppText variant="meta" tone="muted">
              {tApp("home.banner.verify.body", { defaultValue: "One-time check so you can send money." })}
            </AppText>
          </View>
          <Icon name="chevronRight" size={16} color={colors.primaryText} />
        </PressableScale>
      ) : null}

      <View style={styles.shortcuts}>
        <Shortcut icon="heart" label={tApp("favourites.title", { defaultValue: "Favourites" })} onPress={() => router.push("/favourites" as never)} tint={colors.dangerText} bg={colors.dangerSurface} />
        <Shortcut icon="bank" label={t("more.recipients")} onPress={() => router.push("/recipients")} tint="#1E40AF" bg="#EFF6FF" />
        <Shortcut icon="gift" label={tApp("dashboard.referShort", { defaultValue: "Refer" })} onPress={() => router.push("/referrals")} tint={colors.refer} bg={colors.referBg} />
      </View>

      <ListGroup title={tApp("account.groupSecurity", { defaultValue: "Security and limits" })}>
        <ListRow leading={<RowIcon name="shield" />} title={t("more.accountVerification")} onPress={() => router.push("/verification")} trailing={<Badge label={kycLabel} tone={kycTone} />} />
        <ListRow
          leading={<RowIcon name="lock" />}
          title={tApp("more.security", { defaultValue: "Security" })}
          value={pinSet ? tApp("security.on", { defaultValue: "On" }) : tApp("security.off", { defaultValue: "Off" })}
          onPress={() => router.push("/security" as never)}
        />
        <ListRow leading={<RowIcon name="gauge" />} title={tApp("limits.title", { defaultValue: "Limits" })} onPress={() => router.push("/limits" as never)} />
      </ListGroup>

      <ListGroup title={tApp("account.groupPreferences", { defaultValue: "Preferences" })}>
        <LanguagePicker asListRow />
        <ListRow leading={<RowIcon name="bell" />} title={tApp("more.notifications", { defaultValue: "Notifications" })} onPress={() => router.push("/notifications" as never)} />
      </ListGroup>

      <ListGroup title={tApp("account.groupHelp", { defaultValue: "Help" })}>
        <ListRow leading={<RowIcon name="help" />} title={t("more.support")} onPress={() => router.push("/support")} />
        <ListRow leading={<RowIcon name="document" />} title={t("more.legal", { defaultValue: "Legal" })} onPress={() => router.push("/legal" as never)} />
      </ListGroup>

      {/* Log out stands alone at the end, red, and always asks first. */}
      <ListGroup>
        <ListRow
          leading={
            <IconWell tone="danger">
              <Icon name="logout" size={18} color={colors.dangerText} />
            </IconWell>
          }
          title={tApp("account.logOut", { defaultValue: "Log out" })}
          destructive
          chevron={false}
          onPress={() => setConfirmOut(true)}
        />
      </ListGroup>

      <AppText variant="meta" tone="subtle" style={styles.version}>
        {t("more.version", { version: Constants.expoConfig?.version || "1.0.0" })}
      </AppText>

      <ConfirmDialog
        open={confirmOut}
        title={t("more.signOutTitle")}
        description={t("more.signOutDescription")}
        confirmLabel={tApp("account.logOut", { defaultValue: "Log out" })}
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
  content: { paddingHorizontal: space.gutter },
  title: { paddingTop: space.xs, paddingBottom: space.md },
  identity: { alignItems: "center", gap: 4, paddingVertical: space.lg, marginBottom: space.md },
  avatarRing: { padding: 3, borderRadius: 42, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.inputEdge, marginBottom: space.sm },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, maxWidth: "100%" },
  name: { flexShrink: 1 },
  editPill: { marginTop: space.sm, paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  editText: { fontSize: typeSize.meta },
  verify: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.lg, borderRadius: radius.card, backgroundColor: colors.primaryTint, borderWidth: 1, borderColor: colors.primaryBorder, marginBottom: space.lg },
  verifyIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  verifyBody: { flex: 1, minWidth: 0, gap: 2 },
  shortcuts: { flexDirection: "row", gap: space.md, marginBottom: space.xl },
  shortcut: { flex: 1, alignItems: "center", gap: space.sm, paddingVertical: space.lg, borderRadius: radius.card, backgroundColor: colors.surface },
  shortcutIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  version: { textAlign: "center", marginTop: -space.sm },
})
