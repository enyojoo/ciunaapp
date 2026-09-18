import { useRouter } from "expo-router"
import { useEffect } from "react"
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native"
import * as Linking from "expo-linking"
import { useAuth } from "@/lib/auth-context"
import { parseAuthCallbackUrl } from "@/lib/oauth-callback"
import { supabase } from "@/lib/supabase"
import { colors } from "@/lib/theme"

export default function AuthCallbackScreen() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    const run = async () => {
      const url =
        Platform.OS === "web" && typeof window !== "undefined"
          ? window.location.href
          : ((await Linking.getInitialURL()) ?? "")
      if (url) {
        const { code, accessToken, refreshToken } = parseAuthCallbackUrl(url)
        if (code) {
          const { data } = await supabase.auth.getSession()
          if (!data.session) await supabase.auth.exchangeCodeForSession(code)
        } else if (accessToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken ?? "" })
        }
      }
    }
    void run()
  }, [])

  useEffect(() => {
    if (loading) return
    router.replace(user ? "/" : "/auth/login")
  }, [loading, router, user])

  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper },
})
