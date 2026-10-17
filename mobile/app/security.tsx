import { useEffect, useState } from "react"
import { StyleSheet, Switch, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { GroupCard } from "@/components/row"
import { ScreenScroll } from "@/components/screen"
import { useAuth } from "@/lib/auth-context"
import { biometricAvailable, biometricEnabled, clearPin, hasPin, setBiometricEnabled } from "@/lib/pin"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { NARROW_COLUMN } from "@/lib/layout-metrics"
import { colors, radius, type as typeSize, ui } from "@/lib/theme"

/** App lock settings: the optional PIN (on or off, change) and Face ID or fingerprint unlock. */
export default function SecurityScreen() {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { user } = useAuth()
  const [pinOn, setPinOn] = useState(false)
  const [bio, setBio] = useState(false)
  const [bioAvail, setBioAvail] = useState(false)
  const [confirmOff, setConfirmOff] = useState(false)

  const load = async () => {
    if (!user) return
    setPinOn(await hasPin(user.id))
    setBio(await biometricEnabled(user.id))
    setBioAvail(await biometricAvailable())
  }
  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when the signed-in user changes
  }, [user?.id])
  useFocusRevalidate(() => void load())

  const togglePin = (on: boolean) => {
    if (on) router.push("/pin-setup?mode=create" as never)
    else setConfirmOff(true)
  }

  return (
    <ScreenScroll edges={["left", "right", "bottom"]} contentStyle={NARROW_COLUMN}>
      <Text style={ui.title}>{t("security.title")}</Text>
      <Text style={[ui.subtitle, styles.lead]}>{t("security.lead")}</Text>
      <GroupCard>
        <View style={[styles.row, pinOn && bioAvail && styles.rowLine]}>
          <View style={styles.text}>
            <Text style={styles.label}>{t("security.pin")}</Text>
            <Text style={styles.hint}>{t("security.pinHint")}</Text>
          </View>
          <Switch value={pinOn} onValueChange={togglePin} trackColor={{ true: colors.primary, false: colors.inputEdge }} thumbColor="#FFFFFF" accessibilityLabel={t("security.pin")} />
        </View>
        {pinOn ? (
          <View style={[styles.row, bioAvail && styles.rowLine]}>
            <Text style={[styles.label, styles.text]}>{t("security.changePin")}</Text>
            <Text style={styles.link} onPress={() => router.push("/pin-setup?mode=change" as never)} accessibilityRole="button">{t("security.change")}</Text>
          </View>
        ) : null}
        {pinOn && bioAvail ? (
          <View style={styles.row}>
            <View style={styles.text}>
              <Text style={styles.label}>{t("security.biometric")}</Text>
              <Text style={styles.hint}>{t("security.biometricHint")}</Text>
            </View>
            <Switch
              value={bio}
              onValueChange={(v) => {
                setBio(v)
                if (user) void setBiometricEnabled(user.id, v)
              }}
              trackColor={{ true: colors.primary, false: colors.inputEdge }}
              thumbColor="#FFFFFF"
              accessibilityLabel={t("security.biometric")}
            />
          </View>
        ) : null}
      </GroupCard>
      <ConfirmDialog
        open={confirmOff}
        title={t("security.offTitle")}
        description={t("security.offBody")}
        confirmLabel={t("security.turnOff")}
        cancelLabel={t("security.keep")}
        destructive
        onCancel={() => setConfirmOff(false)}
        onConfirm={() => {
          setConfirmOff(false)
          if (user) void clearPin(user.id).then(() => setPinOn(false))
        }}
      />
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  lead: { marginTop: 6, marginBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, paddingHorizontal: 14, paddingVertical: 10 },
  rowLine: { borderBottomWidth: 1, borderBottomColor: colors.border },
  text: { flex: 1 },
  label: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  hint: { marginTop: 2, fontSize: typeSize.meta, color: colors.muted },
  link: { minHeight: 44, textAlignVertical: "center", fontSize: typeSize.body, fontWeight: "700", color: colors.primaryText },
})
