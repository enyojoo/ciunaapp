import { Linking, Pressable, Text } from "react-native"
import { Screen } from "@/components/screen"

export default function SupportScreen() {
  return (
    <Screen className="px-5">
      <Text className="mb-3 text-2xl font-bold">Support</Text>
      <Pressable onPress={() => void Linking.openURL("mailto:support@ciuna.com")}>
        <Text className="text-primary">support@ciuna.com</Text>
      </Pressable>
    </Screen>
  )
}
