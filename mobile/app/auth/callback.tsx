import { useRouter } from "expo-router"
import { useEffect } from "react"
import { ActivityIndicator, View } from "react-native"
import * as Linking from "expo-linking"
import { supabase } from "@/lib/supabase"

export default function AuthCallbackScreen() {
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      const url = await Linking.getInitialURL()
      if (url) {
        const parsed = Linking.parse(url)
        const code = typeof parsed.queryParams?.code === "string" ? parsed.queryParams.code : null
        if (code) {
          await supabase.auth.exchangeCodeForSession(code)
        }
      }
      router.replace("/")
    }
    void run()
  }, [router])

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator color="#F97316" />
    </View>
  )
}
