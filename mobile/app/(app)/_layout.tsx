import { Redirect, Tabs, usePathname, useRouter } from "expo-router"
import { Home, History, LayoutDashboard } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useAuth } from "@/lib/auth-context"
import {
  TAB_BAR_ICON_SIZE,
  TAB_BAR_LABEL_LINE_HEIGHT,
  TAB_BAR_LABEL_SIZE,
} from "@/lib/layout-metrics"
import { useResponsiveLayout } from "@/lib/responsive-layout"
import { tabBarBottomInset, tabBarHeight, tabBarPaddingTop } from "@/lib/tab-bar-layout"
import { colors } from "@/lib/theme"

const HOME_HREF = "/(app)/hub" as const

export default function AppTabs() {
  const { t } = useTranslation("common")
  const { user, loading, pinUnlocked } = useAuth()
  const { showSidebarShell, isWeb, mode } = useResponsiveLayout()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const pathname = usePathname()
  if (!loading && !user) return <Redirect href="/auth/login" />
  if (!loading && user && !pinUnlocked) return <Redirect href="/pin" />

  const hideForCheckout = pathname.includes("/checkout")
  const hideTabBar = showSidebarShell || (isWeb && mode !== "mobile") || hideForCheckout
  const webPhoneFrame = isWeb && mode === "mobile"
  const bottomInset = tabBarBottomInset(insets.bottom, webPhoneFrame)
  const barHeight = tabBarHeight(insets.bottom, webPhoneFrame)

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneContainerStyle: hideTabBar
          ? { flex: 1, minHeight: 0, backgroundColor: colors.paper }
          : {
              flex: 1,
              minHeight: 0,
              backgroundColor: colors.paper,
              paddingBottom: barHeight,
            },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarShowLabel: true,
        tabBarLabelPosition: "below-icon",
        tabBarStyle: hideTabBar
          ? { display: "none", height: 0 }
          : {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              borderTopWidth: 1,
              height: barHeight,
              paddingTop: tabBarPaddingTop(),
              paddingBottom: bottomInset,
              overflow: "visible",
              ...(webPhoneFrame ? { position: "relative" as const } : {}),
            },
        tabBarItemStyle: {
          paddingVertical: 0,
          justifyContent: "center",
          overflow: "visible",
        },
        tabBarLabelStyle: {
          fontSize: TAB_BAR_LABEL_SIZE,
          lineHeight: TAB_BAR_LABEL_LINE_HEIGHT,
          fontWeight: "600",
          marginTop: 2,
          marginBottom: 2,
          overflow: "visible",
        },
        tabBarIconStyle: { marginBottom: 0 },
      }}
    >
      <Tabs.Screen
        name="hub"
        listeners={{
          tabPress: (e) => {
            // Reset nested hub stack and clear leftover [slug] params (Expo web → /hub?slug=…).
            e.preventDefault()
            router.replace(HOME_HREF)
          },
        }}
        options={{
          title: t("nav.home", { defaultValue: "Home" }),
          tabBarIcon: ({ color }) => <Home size={TAB_BAR_ICON_SIZE} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: t("nav.transactions", { defaultValue: "Activities" }),
          tabBarIcon: ({ color }) => <History size={TAB_BAR_ICON_SIZE} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t("nav.more", { defaultValue: "More" }),
          tabBarIcon: ({ color }) => (
            <LayoutDashboard size={TAB_BAR_ICON_SIZE} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  )
}
