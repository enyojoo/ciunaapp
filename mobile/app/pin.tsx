import { Redirect } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { PinDots, PinKeypad, PIN_LEN } from "@/components/pin-keypad"
import { Screen } from "@/components/screen"
import { useAuth } from "@/lib/auth-context"
import { attemptsLeft, pinFailures, recordPinFailure, resetPinFailures, tryBiometricUnlock, verifyPin, MAX_PIN_ATTEMPTS } from "@/lib/pin"
import { colors, ui } from "@/lib/theme"

export default function PinScreen() {
  const { t } = useTranslation("common")
  const { user, loading, pinUnlocked, unlockPin, signOut } = useAuth()
  const [pin, setPin] = useState("")
  const [busy, setBusy] = useState(false)
  const [wrong, setWrong] = useState(false)
  const [failures, setFailures] = useState(0)

  useEffect(() => {
    if (user) void pinFailures(user.id).then(setFailures)
  }, [user])

  useEffect(() => {
    if (!user) return
    void (async () => {
      const ok = await tryBiometricUnlock()
      if (ok) {
        await resetPinFailures(user.id)
        unlockPin()
      }
    })()
  }, [user, unlockPin])

  useEffect(() => {
    if (pin.length !== PIN_LEN || !user) return
    void (async () => {
      setBusy(true)
      const ok = await verifyPin(user.id, pin)
      setBusy(false)
      if (ok) {
        await resetPinFailures(user.id)
        unlockPin()
        return
      }
      const n = await recordPinFailure(user.id)
      setFailures(n)
      setWrong(true)
      setPin("")
      if (n >= MAX_PIN_ATTEMPTS) {
        await resetPinFailures(user.id)
        await signOut()
      }
    })()
  }, [pin, user, unlockPin, signOut])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }
  if (!user) return <Redirect href="/auth/login" />
  if (pinUnlocked) return <Redirect href="/(app)/hub" />

  return (
    <Screen padded edges={["top", "bottom", "left", "right"]}>
      <View style={styles.head}>
        <Text style={[ui.title, styles.centerText]}>{t("pinLock.welcomeBack", { defaultValue: "Welcome back" })}</Text>
        <Text style={[ui.subtitle, styles.centerText]}>
          {t("pinLock.enterPin", { defaultValue: "Enter your 4-digit PIN" })}
        </Text>
        <PinDots digits={pin} error={wrong} />
        <Text style={styles.wrong} accessibilityRole="alert">
          {wrong ? t("pinLock.incorrectPin", { defaultValue: "Incorrect PIN" }) : " "}
        </Text>
        <Text style={styles.left}>
          {failures >= 3 && failures < MAX_PIN_ATTEMPTS
            ? attemptsLeft(failures) === 1
              ? t("pinLock.attemptsLeftOne", { defaultValue: "1 attempt left" })
              : t("pinLock.attemptsLeft", { count: attemptsLeft(failures), defaultValue: "{{count}} attempts left" })
            : " "}
        </Text>
      </View>
      <PinKeypad
        disabled={busy}
        onDigit={(d) => {
          setWrong(false)
          setPin((p) => (p.length >= PIN_LEN ? p : p + d))
        }}
        onBackspace={() => setPin((p) => p.slice(0, -1))}
      />
      <Pressable onPress={() => void signOut()} style={styles.logout}>
        <Text style={ui.linkMuted}>{t("pinLock.logOut", { defaultValue: "Log out" })}</Text>
      </Pressable>
    </Screen>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper },
  head: { alignItems: "center", paddingTop: 32 },
  centerText: { textAlign: "center" },
  wrong: { marginTop: 12, minHeight: 20, fontSize: 14, fontWeight: "600", color: colors.danger, textAlign: "center" },
  left: { marginTop: 4, minHeight: 20, fontSize: 13, color: colors.muted, textAlign: "center" },
  logout: { minHeight: 48, alignItems: "center", paddingVertical: 12 },
})
