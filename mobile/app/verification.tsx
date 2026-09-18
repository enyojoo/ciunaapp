import * as ImagePicker from "expo-image-picker"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { PrimaryButton } from "@/components/primary-button"
import { Screen } from "@/components/screen"
import { ui } from "@/lib/theme"

export default function VerificationScreen() {
  const [picked, setPicked] = useState<string | null>(null)
  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 })
    if (!result.canceled) setPicked(result.assets[0]?.uri ?? null)
  }
  return (
    <Screen padded>
      <Text style={ui.title}>Verification</Text>
      <Text style={ui.subtitle}>Upload identity and address documents from your camera roll.</Text>
      <View style={styles.cta}>
        <PrimaryButton label="Choose document" onPress={() => void pick()} />
      </View>
      {picked ? <Text style={ui.meta}>{picked}</Text> : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  cta: { marginTop: 24 },
})
