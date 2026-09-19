import { Redirect, useLocalSearchParams, useRouter } from "expo-router"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { PinDots, PinKeypad, PIN_LEN } from "@/components/pin-keypad"
import { Screen } from "@/components/screen"
import { useToast } from "@/components/toast-provider"
import { useAuth } from "@/lib/auth-context"
import { setPin, verifyPin } from "@/lib/pin"
import { ui } from "@/lib/theme"

type Phase = "current" | "create" | "confirm"

export default function PinSetupScreen() {
  const { t } = useTranslation("common")
  const { mode } = useLocalSearchParams<{ mode?: string }>()
  const change = mode === "change"
  const { user, loading } = useAuth()
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>(change ? "current" : "create")
  const { showError } = useToast()
  const [digits, setDigits] = useState("")
  const [first, setFirst] = useState("")

  if (!loading && !user) return <Redirect href="/auth/login" />

  const title =
    phase === "current"
      ? t("pinDialog.currentPin")
      : phase === "create"
        ? change
          ? t("pinDialog.newPin")
          : t("pinSetup.createTitle")
        : t("pinSetup.confirmTitle")
  const subtitle = phase === "confirm" ? t("pinSetup.confirmSubtitle") : t("pinSetup.createSubtitle")

  const onFilled = async (value: string) => {
    if (!user) return
    if (phase === "current") {
      const ok = await verifyPin(user.id, value)
      if (!ok) {
        showError(t("pinDialog.errorWrongCurrent"))
        setDigits("")
        return
      }
      setDigits("")
      setPhase("create")
      return
    }
    if (phase === "create") {
      setFirst(value)
      setDigits("")
      setPhase("confirm")
      return
    }
    if (value !== first) {
      showError(t("pinSetup.mismatch"))
      setDigits("")
      setPhase("create")
      setFirst("")
      return
    }
    await setPin(user.id, value)
    router.back()
  }

  return (
    <Screen padded edges={["bottom", "left", "right"]}>
      <View style={styles.head}>
        <Text style={[ui.title, styles.centerText]}>{title}</Text>
        <Text style={[ui.subtitle, styles.centerText]}>{subtitle}</Text>
        <PinDots digits={digits} />
      </View>
      <PinKeypad
        onDigit={(d) => {
          const next = digits.length >= PIN_LEN ? digits : digits + d
          setDigits(next)
          if (next.length === PIN_LEN) void onFilled(next)
        }}
        onBackspace={() => setDigits((p) => p.slice(0, -1))}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  head: { alignItems: "center", paddingTop: 32 },
  centerText: { textAlign: "center" },
})
