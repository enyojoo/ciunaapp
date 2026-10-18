import { Redirect, Tabs, usePathname, useRouter } from "expo-router"
import { Icon } from "@/components/ui/icon"
import { useTranslation } from "react-i18next"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useAuth } from "@/lib/auth-context"
import { useChatUnread } from "@/lib/order-chat"
import { useSupportUnread } from "@/lib/support-unread"
import {
  TAB_BAR_ICON_SIZE,
  TAB_BAR_LABEL_LINE_HEIGHT,
  TAB_BAR_LABEL_SIZE,
} from "@/lib/layout-metrics"
import { useResponsiveLayout } from "@/lib/responsive-layout"
import { isTabRootPath, tabBarBottomInset, tabBarHeight, tabBarPaddingTop } from "@/lib/tab-bar-layout"
import { colors } from "@/lib/theme"

const HOME_HREF = "/(app)/hub" as const

export default function AppTabs() {
  const { t } = useTranslation("common")
  const { user, loading, pinUnlocked } = useAuth()
  const { showSidebarShell, isWeb, mode } = useResponsiveLayout()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const pathname = usePathname()
  const chatUnread = useChatUnread(null, Boolean(user))
  const supportUnread = useSupportUnread(Boolean(user))
  if (!loading && !user) return <Redirect href="/auth/login" />
  if (!loading && user && !pinUnlocked) return <Redirect href="/pin" />

  // Tabs show on the three roots only; deeper hub screens (line, store, product, cart, checkout) cover them.
  const hideTabBar = showSidebarShell || (isWeb && mode !== "mobile") || !isTabRootPath(pathname)
  const badge = (n: number) => (n > 0 ? (n > 9 ? "9+" : String(n)) : undefined)

  // One docked tab bar on every platform (full width, border on top, sits on the bottom edge). iOS 26's system tab bar
  // floats as a pill over the content, so the app uses its own bar on iOS too.
  const bottomInset = tabBarBottomInset(insets.bottom, false)
  const barHeight = tabBarHeight(insets.bottom, false)

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // sceneContainerStyle is read at runtime by the tabs navigator; its typing was dropped in newer versions.
        ...({ sceneContainerStyle: hideTabBar
          ? { flex: 1, minHeight: 0, backgroundColor: colors.paper }
          : {
              flex: 1,
              minHeight: 0,
              backgroundColor: colors.paper,
              paddingBottom: barHeight,
            } } as object),
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
          tabBarIcon: ({ color, focused }) => <Icon name="home" size={TAB_BAR_ICON_SIZE} color={color} filled={focused} />,
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: t("nav.activities", { defaultValue: "Activities" }),
          tabBarBadge: badge(chatUnread.count),
          tabBarIcon: ({ color }) => <Icon name="activity" size={TAB_BAR_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t("nav.account", { defaultValue: "Account" }),
          tabBarBadge: badge(supportUnread.count),
          tabBarIcon: ({ color, focused }) => <Icon name="account" size={TAB_BAR_ICON_SIZE} color={color} filled={focused} />,
        }}
      />
    </Tabs>
  )
}
