import { Redirect } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { PinDots, PinKeypad, PIN_LEN } from "@/components/pin-keypad"
import { Screen } from "@/components/screen"
import { useToast } from "@/components/toast-provider"
import { useAuth } from "@/lib/auth-context"
import { tryBiometricUnlock, verifyPin } from "@/lib/pin"
import { colors, ui } from "@/lib/theme"

export default function PinScreen() {
  const { t } = useTranslation("common")
  const { user, loading, pinUnlocked, unlockPin, signOut } = useAuth()
  const { showError } = useToast()
  const [pin, setPin] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) return
    void (async () => {
      const ok = await tryBiometricUnlock()
      if (ok) unlockPin()
    })()
  }, [user, unlockPin])

  useEffect(() => {
    if (pin.length !== PIN_LEN || !user) return
    void (async () => {
      setBusy(true)
      const ok = await verifyPin(user.id, pin)
      setBusy(false)
      if (ok) unlockPin()
      else {
        showError(t("pinLock.incorrectPin", { defaultValue: "Incorrect PIN" }))
        setPin("")
      }
    })()
  }, [pin, user, unlockPin, t, showError])

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
        <PinDots digits={pin} />
      </View>
      <PinKeypad
        disabled={busy}
        onDigit={(d) => {
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
  logout: { minHeight: 48, alignItems: "center", paddingVertical: 12 },
})
