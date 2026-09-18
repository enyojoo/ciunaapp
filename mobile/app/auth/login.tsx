import { Link, useRouter } from "expo-router"
import { useState } from "react"
import { ActivityIndicator, Pressable, Text, TextInput } from "react-native"
import { useTranslation } from "react-i18next"
import { Screen } from "@/components/screen"
import { useAuth } from "@/lib/auth-context"

export default function LoginScreen() {
  const { t } = useTranslation("app")
  const { signIn, signInWithGoogle } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const onSubmit = async () => {
    setBusy(true)
    setError("")
    const { error: err } = await signIn(email.trim(), password)
    setBusy(false)
    if (err) setError(err)
    else router.replace("/")
  }

  const onGoogle = async () => {
    setBusy(true)
    setError("")
    const { error: err } = await signInWithGoogle()
    setBusy(false)
    if (err) setError(err)
    else router.replace("/")
  }

  return (
    <Screen className="justify-center px-6">
      <Text className="mb-1 text-3xl font-bold text-gray-900">Ciuna</Text>
      <Text className="mb-6 text-gray-500">{t("auth.signInTitle", { defaultValue: "Sign in" })}</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        className="mb-3 rounded-xl border border-gray-200 px-3 py-3 text-base"
      />
      <TextInput
        secureTextEntry
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        className="mb-3 rounded-xl border border-gray-200 px-3 py-3 text-base"
      />
      {error ? <Text className="mb-3 text-red-600">{error}</Text> : null}
      <Pressable onPress={() => void onSubmit()} disabled={busy} className="items-center rounded-xl bg-primary py-3.5">
        {busy ? <ActivityIndicator color="#fff" /> : <Text className="font-semibold text-white">{t("auth.signIn", { defaultValue: "Sign in" })}</Text>}
      </Pressable>
      <Pressable onPress={() => void onGoogle()} disabled={busy} className="mt-3 items-center rounded-xl border border-gray-200 py-3.5">
        <Text className="font-semibold text-gray-900">Google</Text>
      </Pressable>
      <Link href="/auth/register" className="mt-4 text-center text-primary">
        {t("auth.createAccount", { defaultValue: "Create account" })}
      </Link>
      <Link href="/auth/forgot-password" className="mt-3 text-center text-gray-500">
        {t("auth.forgotPassword", { defaultValue: "Forgot password" })}
      </Link>
    </Screen>
  )
}
