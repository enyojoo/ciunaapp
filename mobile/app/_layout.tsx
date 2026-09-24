import "@/lib/nativewind-flags"
import "../global.css"
import "@/lib/web-crypto"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Platform, StyleSheet, View } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { ResponsiveAppShell } from "@/components/layout/responsive-app-shell"
import { SessionRestoreCanvas } from "@/components/layout/session-restore-canvas"
import { ShellAwareSafeArea } from "@/components/layout/shell-aware-safe-area"
import { WebViewportFrame } from "@/components/layout/web-viewport-frame"
import { OfficeConfigLiveSync } from "@/components/office-config-live-sync"
import { ToastProvider } from "@/components/toast-provider"
import { AuthProvider, useAuth } from "@/lib/auth-context"
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
    const root = document.getElementById("root")
    html.style.height = "100%"
    html.style.backgroundColor = colors.paper
    body.style.height = "100%"
    body.style.margin = "0"
    body.style.backgroundColor = colors.paper
    if (root) {
      root.style.height = "100%"
      root.style.display = "flex"
      root.style.flexDirection = "column"
      root.style.minHeight = "100%"
      root.style.backgroundColor = colors.paper
    }
  }, [])

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ResponsiveLayoutProvider>
          <ShellAwareSafeArea>
            <ToastProvider>
              <ExternalLinkProvider>
                <OfficeConfigLiveSync />
                <StatusBar style="dark" />
                <RootChrome>
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
                      <Stack.Screen name="verification/bitbanker" options={{ headerShown: true, title: "" }} />
                      <Stack.Screen name="verification/identity" options={{ headerShown: true, title: "" }} />
                      <Stack.Screen name="verification/address" options={{ headerShown: true, title: "" }} />
                      <Stack.Screen name="referrals" options={{ headerShown: true, title: t("referrals.pageTitle") }} />
                      <Stack.Screen name="orders/[id]" options={{ headerShown: true, title: "Order" }} />
                    </Stack>
                    </View>
                </RootChrome>
              </ExternalLinkProvider>
            </ToastProvider>
          </ShellAwareSafeArea>
        </ResponsiveLayoutProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}

function RootChrome({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const restoring = Platform.OS === "web" && loading && !user

  if (restoring) {
    return <SessionRestoreCanvas />
  }

  return (
    <View style={styles.chrome}>
      <WebViewportFrame>
        <ResponsiveAppShell>{children}</ResponsiveAppShell>
      </WebViewportFrame>
    </View>
  )
}

const styles = StyleSheet.create({
  chrome: { flex: 1, width: "100%", minHeight: 0, height: Platform.OS === "web" ? "100%" : undefined },
  navRoot: {
    flex: 1,
    width: "100%",
    minHeight: 0,
    height: Platform.OS === "web" ? "100%" : undefined,
  },
})
