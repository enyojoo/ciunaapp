import "../global.css"
import "@/lib/web-crypto"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect } from "react"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { ToastProvider } from "@/components/toast-provider"
import { AuthProvider } from "@/lib/auth-context"
import { ExternalLinkProvider } from "@/lib/external-link"
import { hydrateLocale } from "@/lib/i18n"
import { colors } from "@/lib/theme"

export default function RootLayout() {
  useEffect(() => {
    void hydrateLocale()
  }, [])

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <ExternalLinkProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.paper },
                headerStyle: { backgroundColor: colors.paper },
                headerShadowVisible: false,
                headerTintColor: colors.text,
                headerBackButtonDisplayMode: "minimal",
                animationDuration: 180,
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="(app)" />
              <Stack.Screen name="pin" />
              <Stack.Screen name="pin-setup" options={{ headerShown: false }} />
              <Stack.Screen name="send" options={{ headerShown: false, gestureEnabled: true, fullScreenGestureEnabled: true }} />
              <Stack.Screen name="food" />
              <Stack.Screen name="mart" />
              <Stack.Screen name="experts" />
              <Stack.Screen name="assistant" options={{ headerShown: true, title: "Assistant" }} />
              <Stack.Screen name="support" options={{ headerShown: true, title: "Support" }} />
              <Stack.Screen name="recipients" options={{ headerShown: true, title: "Recipients" }} />
              <Stack.Screen name="profile" options={{ headerShown: true, title: "Profile" }} />
              <Stack.Screen name="verification" options={{ headerShown: true, title: "Verification" }} />
              <Stack.Screen name="referrals" options={{ headerShown: true, title: "Referrals" }} />
              <Stack.Screen name="orders/[id]" options={{ headerShown: true, title: "Order" }} />
            </Stack>
          </ExternalLinkProvider>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
