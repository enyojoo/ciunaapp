import "@/lib/nativewind-flags"
import { OfflineBanner } from "@/components/offline-banner"
import "../global.css"
import "@/lib/web-crypto"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Platform, StyleSheet, View } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { ResponsiveAppShell } from "@/components/layout/responsive-app-shell"
import { SessionRestoreCanvas } from "@/components/layout/session-restore-canvas"
import { ShellAwareSafeArea } from "@/components/layout/shell-aware-safe-area"
import { WebViewportFrame } from "@/components/layout/web-viewport-frame"
import { OfficeConfigLiveSync } from "@/components/office-config-live-sync"
import { ToastProvider } from "@/components/toast-provider"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { PushRegistration } from "@/components/push-registration"
import { ExternalLinkProvider } from "@/lib/external-link"
import { hydrateLocale } from "@/lib/i18n"
import { ResponsiveLayoutProvider } from "@/lib/responsive-layout"
import { colors, type as typeSize } from "@/lib/theme"

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
    <GestureHandlerRootView style={styles.gestureRoot}>
    <SafeAreaProvider>
      <AuthProvider>
        <ResponsiveLayoutProvider>
          <ShellAwareSafeArea>
            <ToastProvider>
              <ExternalLinkProvider>
                <OfficeConfigLiveSync />
                <PushRegistration />
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
                        headerTitleStyle: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
                        headerTitleAlign: "center",
                        animationDuration: 180,
                        // Screens that show a header get the native one (system back, swipe, iOS glass). Screens with a
                        // cover photo or custom actions draw `NavBar` themselves and keep headerShown off.
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
                      <Stack.Screen name="security" options={{ headerShown: true, title: "" }} />
                      <Stack.Screen name="notifications" options={{ headerShown: true, title: "" }} />
                      <Stack.Screen name="delete-account" options={{ headerShown: true, title: "" }} />
                      <Stack.Screen name="support" options={{ headerShown: true, title: t("support.title") }} />
                      <Stack.Screen name="support/requests" options={{ headerShown: true, title: t("support.req.myRequests") }} />
                      <Stack.Screen name="support/new" options={{ headerShown: true, title: t("support.req.newRequest") }} />
                      <Stack.Screen name="support/[id]" options={{ headerShown: true, title: "" }} />
                      <Stack.Screen name="recipients/index" options={{ headerShown: true, title: t("recipients.title") }} />
                      <Stack.Screen name="recipients/form" options={{ headerShown: true, title: "" }} />
                      <Stack.Screen name="profile" options={{ headerShown: true, title: t("profile.title") }} />
                      <Stack.Screen name="verification/index" options={{ headerShown: true, title: t("verification.hubTitle") }} />
                      <Stack.Screen name="verification/bitbanker" options={{ headerShown: true, title: "" }} />
                      <Stack.Screen name="verification/identity" options={{ headerShown: true, title: "" }} />
                      <Stack.Screen name="verification/address" options={{ headerShown: true, title: "" }} />
                      <Stack.Screen name="limits" options={{ headerShown: true, title: t("limits.title") }} />
                      <Stack.Screen name="referrals" options={{ headerShown: true, title: t("referrals.pageTitle") }} />
                      <Stack.Screen name="search" options={{ gestureEnabled: true }} />
                      <Stack.Screen name="dev/gallery" options={{ headerShown: true, title: "UI gallery" }} />
                      <Stack.Screen name="favourites" options={{ headerShown: true, title: t("favourites.title", { defaultValue: "Favourites" }) }} />
                      <Stack.Screen name="orders/[id]/chat" options={{ headerShown: true, title: t("chat.title", { defaultValue: "Chat with seller" }) }} />
                      <Stack.Screen name="orders/[id]" options={{ headerShown: true, title: "Order" }} />
                      <Stack.Screen name="receipt/[kind]/[id]" options={{ headerShown: true, title: t("receipt.title") }} />
                    </Stack>
                    </View>
                </RootChrome>
              </ExternalLinkProvider>
            </ToastProvider>
          </ShellAwareSafeArea>
        </ResponsiveLayoutProvider>
      </AuthProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
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
      <OfflineBanner />
    </View>
  )
}

const styles = StyleSheet.create({
  gestureRoot: { flex: 1 },
  chrome: { flex: 1, width: "100%", minHeight: 0, height: Platform.OS === "web" ? "100%" : undefined },
  navRoot: {
    flex: 1,
    width: "100%",
    minHeight: 0,
    height: Platform.OS === "web" ? "100%" : undefined,
  },
})
