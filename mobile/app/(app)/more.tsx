import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { Pressable, ScrollView, Text, TextInput } from "react-native"
import { useTranslation } from "react-i18next"
import { LanguagePicker } from "@/components/language-picker"
import { useAuth } from "@/lib/auth-context"
import { hasPin, setPin } from "@/lib/pin"

export default function MoreScreen() {
  const { t } = useTranslation("common")
  const { signOut, profile, user } = useAuth()
  const router = useRouter()
  const [pinValue, setPinValue] = useState("")
  const [pinSet, setPinSet] = useState(false)

  useEffect(() => {
    if (!user) return
    void hasPin(user.id).then(setPinSet)
  }, [user])

  const savePin = async () => {
    if (!user || pinValue.length < 4) return
    await setPin(user.id, pinValue)
    setPinSet(true)
    setPinValue("")
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="p-5">
      <Text className="mb-4 text-2xl font-bold">{t("more.title", { defaultValue: "More" })}</Text>
      <Row label={t("more.yourProfile", { defaultValue: "Your profile" })} onPress={() => router.push("/profile")} />
      <Row label={t("more.accountVerification", { defaultValue: "Verification" })} onPress={() => router.push("/verification")} />
      <Row label={t("more.affiliatesReferrals", { defaultValue: "Referrals" })} onPress={() => router.push("/referrals")} />
      <Row label={t("more.recipients", { defaultValue: "Recipients" })} onPress={() => router.push("/recipients")} />
      <Row label={t("more.support", { defaultValue: "Support" })} onPress={() => router.push("/support")} />
      <LanguagePicker />
      <Text className="mb-2 mt-5 font-semibold">{pinSet ? "Update PIN" : "Set PIN"}</Text>
      <TextInput
        value={pinValue}
        onChangeText={setPinValue}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        placeholder="4–6 digits"
        className="mb-3 rounded-xl border border-gray-200 px-3 py-3"
      />
      <Pressable onPress={() => void savePin()} className="mb-8 items-center rounded-xl border border-gray-200 py-3">
        <Text className="font-semibold">Save PIN</Text>
      </Pressable>
      <Pressable onPress={() => void signOut()} className="items-center">
        <Text className="font-semibold text-red-600">{t("nav.logout", { defaultValue: "Log out" })}</Text>
      </Pressable>
      {profile?.email ? <Text className="mt-6 text-center text-gray-400">{profile.email}</Text> : null}
    </ScrollView>
  )
}

function Row({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="border-b border-gray-100 py-4">
      <Text className="text-base">{label}</Text>
    </Pressable>
  )
}
