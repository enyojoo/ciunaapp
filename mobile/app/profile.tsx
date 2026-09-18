import { Text } from "react-native"
import { Screen } from "@/components/screen"
import { useAuth } from "@/lib/auth-context"
import { ui } from "@/lib/theme"

export default function ProfileScreen() {
  const { profile } = useAuth()
  return (
    <Screen padded>
      <Text style={ui.title}>Profile</Text>
      <Text style={ui.subtitle}>
        {profile?.first_name} {profile?.last_name}
      </Text>
      <Text style={ui.meta}>{profile?.email}</Text>
    </Screen>
  )
}
