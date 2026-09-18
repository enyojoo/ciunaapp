import * as ImagePicker from "expo-image-picker"
import { useState } from "react"
import { Pressable, Text } from "react-native"
import { Screen } from "@/components/screen"

export default function VerificationScreen() {
  const [picked, setPicked] = useState<string | null>(null)
  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 })
    if (!result.canceled) setPicked(result.assets[0]?.uri ?? null)
  }
  return (
    <Screen className="px-5">
      <Text className="mb-3 text-2xl font-bold">Verification</Text>
      <Text className="mb-4 text-gray-500">Upload identity and address documents from your camera roll.</Text>
      <Pressable onPress={() => void pick()} className="items-center rounded-xl bg-primary py-3.5">
        <Text className="font-semibold text-white">Choose document</Text>
      </Pressable>
      {picked ? <Text className="mt-3 text-gray-500">{picked}</Text> : null}
    </Screen>
  )
}
