import { Redirect } from "expo-router"
import { ActivityIndicator, View } from "react-native"
import { useAuth } from "@/lib/auth-context"

export default function Index() {
  const { user, loading, pinUnlocked } = useAuth()
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#F97316" />
      </View>
    )
  }
  if (!user) return <Redirect href="/auth/login" />
  if (!pinUnlocked) return <Redirect href="/pin" />
  return <Redirect href="/(app)/hub" />
}
