import { Redirect, Tabs } from "expo-router"
import { Home, History, LayoutDashboard } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/lib/auth-context"
import { colors } from "@/lib/theme"

export default function AppTabs() {
  const { t } = useTranslation("common")
  const { user, loading, pinUnlocked } = useAuth()
  if (!loading && !user) return <Redirect href="/auth/login" />
  if (!loading && user && !pinUnlocked) return <Redirect href="/pin" />

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="hub"
        options={{
          title: t("nav.home", { defaultValue: "Home" }),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: t("nav.transactions", { defaultValue: "Transactions" }),
          tabBarIcon: ({ color, size }) => <History size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t("nav.more", { defaultValue: "More" }),
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
