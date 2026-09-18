import "../global.css"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect } from "react"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { AuthProvider } from "@/lib/auth-context"
import { hydrateLocale } from "@/lib/i18n"

export default function RootLayout() {
  useEffect(() => {
    void hydrateLocale()
  }, [])

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="pin" />
          <Stack.Screen name="send" options={{ headerShown: true, title: "Send" }} />
          <Stack.Screen name="food" options={{ headerShown: true, title: "Food" }} />
          <Stack.Screen name="mart" options={{ headerShown: true, title: "Mart" }} />
          <Stack.Screen name="experts" options={{ headerShown: true, title: "Experts" }} />
          <Stack.Screen name="assistant" options={{ headerShown: true, title: "Assistant" }} />
          <Stack.Screen name="support" options={{ headerShown: true, title: "Support" }} />
          <Stack.Screen name="recipients" options={{ headerShown: true, title: "Recipients" }} />
          <Stack.Screen name="profile" options={{ headerShown: true, title: "Profile" }} />
          <Stack.Screen name="verification" options={{ headerShown: true, title: "Verification" }} />
          <Stack.Screen name="referrals" options={{ headerShown: true, title: "Referrals" }} />
          <Stack.Screen name="orders/[id]" options={{ headerShown: true, title: "Order" }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
