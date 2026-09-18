import { Text } from "react-native"
import { Screen } from "@/components/screen"
import { useAuth } from "@/lib/auth-context"

export default function ProfileScreen() {
  const { profile } = useAuth()
  return (
    <Screen className="px-5">
      <Text className="mb-3 text-2xl font-bold">Profile</Text>
      <Text>
        {profile?.first_name} {profile?.last_name}
      </Text>
      <Text className="mt-2 text-gray-500">{profile?.email}</Text>
    </Screen>
  )
}
