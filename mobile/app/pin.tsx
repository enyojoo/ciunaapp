import { Redirect } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native"
import { Screen } from "@/components/screen"
import { useAuth } from "@/lib/auth-context"
import { tryBiometricUnlock, verifyPin } from "@/lib/pin"

export default function PinScreen() {
  const { user, loading, pinUnlocked, unlockPin } = useAuth()
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user) return
    void (async () => {
      const ok = await tryBiometricUnlock()
      if (ok) unlockPin()
    })()
  }, [user, unlockPin])

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#F97316" />
      </View>
    )
  }
  if (!user) return <Redirect href="/auth/login" />
  if (pinUnlocked) return <Redirect href="/(app)/hub" />

  const submit = async () => {
    const ok = await verifyPin(user.id, pin)
    if (ok) unlockPin()
    else setError("Incorrect PIN")
  }

  return (
    <Screen className="justify-center px-6">
      <Text className="mb-2 text-2xl font-bold">Unlock</Text>
      <Text className="mb-6 text-gray-500">Enter your PIN or use Face ID.</Text>
      <TextInput
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        className="mb-3 rounded-xl border border-gray-200 px-3 py-3 text-center text-xl tracking-widest"
      />
      {error ? <Text className="mb-3 text-red-600">{error}</Text> : null}
      <Pressable onPress={() => void submit()} className="items-center rounded-xl bg-primary py-3.5">
        <Text className="font-semibold text-white">Unlock</Text>
      </Pressable>
    </Screen>
  )
}
