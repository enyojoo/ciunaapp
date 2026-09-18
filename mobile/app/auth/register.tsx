import { Link, useRouter } from "expo-router"
import { useState } from "react"
import { ActivityIndicator, Pressable, Text, TextInput } from "react-native"
import { useTranslation } from "react-i18next"
import { Screen } from "@/components/screen"
import { useAuth } from "@/lib/auth-context"

export default function RegisterScreen() {
  const { t } = useTranslation("app")
  const { signUp } = useAuth()
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const onSubmit = async () => {
    setBusy(true)
    setError("")
    const { error: err } = await signUp(email.trim(), password, firstName.trim(), lastName.trim())
    setBusy(false)
    if (err) setError(err)
    else router.replace("/auth/login")
  }

  return (
    <Screen className="justify-center px-6">
      <Text className="mb-4 text-2xl font-bold">{t("auth.createAccount", { defaultValue: "Create account" })}</Text>
      <TextInput placeholder="First name" value={firstName} onChangeText={setFirstName} className="mb-3 rounded-xl border border-gray-200 px-3 py-3 text-base" />
      <TextInput placeholder="Last name" value={lastName} onChangeText={setLastName} className="mb-3 rounded-xl border border-gray-200 px-3 py-3 text-base" />
      <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="Email" value={email} onChangeText={setEmail} className="mb-3 rounded-xl border border-gray-200 px-3 py-3 text-base" />
      <TextInput secureTextEntry placeholder="Password" value={password} onChangeText={setPassword} className="mb-3 rounded-xl border border-gray-200 px-3 py-3 text-base" />
      {error ? <Text className="mb-3 text-red-600">{error}</Text> : null}
      <Pressable onPress={() => void onSubmit()} disabled={busy} className="items-center rounded-xl bg-primary py-3.5">
        {busy ? <ActivityIndicator color="#fff" /> : <Text className="font-semibold text-white">{t("auth.register", { defaultValue: "Register" })}</Text>}
      </Pressable>
      <Link href="/auth/login" className="mt-4 text-center text-primary">
        {t("auth.signIn", { defaultValue: "Sign in" })}
      </Link>
    </Screen>
  )
}
