import { Link } from "expo-router"
import { useState } from "react"
import { ActivityIndicator, Pressable, Text, TextInput } from "react-native"
import { useTranslation } from "react-i18next"
import { Screen } from "@/components/screen"
import { apiFetch } from "@/lib/api"

export default function ForgotPasswordScreen() {
  const { t } = useTranslation("app")
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  const onSubmit = async () => {
    setBusy(true)
    setMessage("")
    const res = await apiFetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    })
    setBusy(false)
    const body = await res.json().catch(() => ({}))
    setMessage((body as { message?: string; error?: string }).message || (body as { error?: string }).error || "")
  }

  return (
    <Screen className="justify-center px-6">
      <Text className="mb-4 text-2xl font-bold">{t("auth.forgotPassword", { defaultValue: "Forgot password" })}</Text>
      <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="Email" value={email} onChangeText={setEmail} className="mb-3 rounded-xl border border-gray-200 px-3 py-3 text-base" />
      {message ? <Text className="mb-3 text-gray-500">{message}</Text> : null}
      <Pressable onPress={() => void onSubmit()} disabled={busy} className="items-center rounded-xl bg-primary py-3.5">
        {busy ? <ActivityIndicator color="#fff" /> : <Text className="font-semibold text-white">{t("auth.sendCode", { defaultValue: "Send code" })}</Text>}
      </Pressable>
      <Link href="/auth/reset-password" className="mt-4 text-center text-primary">
        {t("auth.resetPassword", { defaultValue: "Reset password" })}
      </Link>
      <Link href="/auth/login" className="mt-3 text-center text-gray-500">
        {t("auth.signIn", { defaultValue: "Sign in" })}
      </Link>
    </Screen>
  )
}
