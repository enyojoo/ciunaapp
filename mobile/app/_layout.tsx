import "@/lib/nativewind-flags"
import "../global.css"
import "@/lib/web-crypto"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Platform, StyleSheet, View } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { ResponsiveAppShell } from "@/components/layout/responsive-app-shell"
import { ShellAwareSafeArea } from "@/components/layout/shell-aware-safe-area"
import { WebViewportFrame } from "@/components/layout/web-viewport-frame"
import { ToastProvider } from "@/components/toast-provider"
import { AuthProvider } from "@/lib/auth-context"
import { ExternalLinkProvider } from "@/lib/external-link"
import { hydrateLocale } from "@/lib/i18n"
import { ResponsiveLayoutProvider } from "@/lib/responsive-layout"
import { colors } from "@/lib/theme"

export default function RootLayout() {
  const { t } = useTranslation("app")

  useEffect(() => {
    void hydrateLocale()
  }, [])

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return
    const html = document.documentElement
    const body = document.body
    html.style.height = "100%"
    body.style.height = "100%"
    body.style.margin = "0"
    html.style.backgroundColor = colors.paper
    body.style.backgroundColor = colors.paper
  }, [])

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ResponsiveLayoutProvider>
          <ShellAwareSafeArea>
            <ToastProvider>
              <ExternalLinkProvider>
                <StatusBar style="dark" />
                <WebViewportFrame>
                  <ResponsiveAppShell>
                    <View style={styles.navRoot}>
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
                      <Stack.Screen name="pin-setup" options={{ headerShown: true, title: "" }} />
                      <Stack.Screen name="send" options={{ headerShown: false, gestureEnabled: true, fullScreenGestureEnabled: true }} />
                      <Stack.Screen name="food" />
                      <Stack.Screen name="mart" />
                      <Stack.Screen name="experts" />
                      <Stack.Screen name="assistant" options={{ headerShown: true, title: "Assistant" }} />
                      <Stack.Screen name="support" options={{ headerShown: true, title: t("support.title") }} />
                      <Stack.Screen name="recipients/index" options={{ headerShown: true, title: t("recipients.title") }} />
                      <Stack.Screen name="recipients/form" options={{ headerShown: true, title: "" }} />
                      <Stack.Screen name="profile" options={{ headerShown: true, title: t("profile.title") }} />
                      <Stack.Screen name="verification/index" options={{ headerShown: true, title: t("verification.hubTitle") }} />
                      <Stack.Screen name="verification/identity" options={{ headerShown: true, title: "" }} />
                      <Stack.Screen name="verification/address" options={{ headerShown: true, title: "" }} />
                      <Stack.Screen name="referrals" options={{ headerShown: true, title: t("referrals.pageTitle") }} />
                      <Stack.Screen name="orders/[id]" options={{ headerShown: true, title: "Order" }} />
                    </Stack>
                    </View>
                  </ResponsiveAppShell>
                </WebViewportFrame>
              </ExternalLinkProvider>
            </ToastProvider>
          </ShellAwareSafeArea>
        </ResponsiveLayoutProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  navRoot: {
    flex: 1,
    width: "100%",
    height: Platform.OS === "web" ? "100%" : undefined,
    minHeight: Platform.OS === "web" ? "100%" : undefined,
  },
})
