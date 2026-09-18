import { Link, useRouter } from "expo-router"
import { useState } from "react"
import { ActivityIndicator, Pressable, Text, TextInput } from "react-native"
import { useTranslation } from "react-i18next"
import { Screen } from "@/components/screen"
import { apiFetch } from "@/lib/api"

export default function ResetPasswordScreen() {
  const { t } = useTranslation("app")
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const onSubmit = async () => {
    setBusy(true)
    setError("")
    const verify = await apiFetch("/api/auth/verify-reset-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), token: otp.trim() }),
    })
    if (!verify.ok) {
      setBusy(false)
      setError("Invalid code")
      return
    }
    const res = await apiFetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), token: otp.trim(), password }),
    })
    setBusy(false)
    if (!res.ok) {
      setError("Could not reset password")
      return
    }
    router.replace("/auth/login")
  }

  return (
    <Screen className="justify-center px-6">
      <Text className="mb-4 text-2xl font-bold">{t("auth.resetPassword", { defaultValue: "Reset password" })}</Text>
      <TextInput autoCapitalize="none" placeholder="Email" value={email} onChangeText={setEmail} className="mb-3 rounded-xl border border-gray-200 px-3 py-3 text-base" />
      <TextInput placeholder="OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" className="mb-3 rounded-xl border border-gray-200 px-3 py-3 text-base" />
      <TextInput secureTextEntry placeholder="New password" value={password} onChangeText={setPassword} className="mb-3 rounded-xl border border-gray-200 px-3 py-3 text-base" />
      {error ? <Text className="mb-3 text-red-600">{error}</Text> : null}
      <Pressable onPress={() => void onSubmit()} disabled={busy} className="items-center rounded-xl bg-primary py-3.5">
        {busy ? <ActivityIndicator color="#fff" /> : <Text className="font-semibold text-white">{t("auth.save", { defaultValue: "Save" })}</Text>}
      </Pressable>
      <Link href="/auth/login" className="mt-4 text-center text-gray-500">
        {t("auth.signIn", { defaultValue: "Sign in" })}
      </Link>
    </Screen>
  )
}
