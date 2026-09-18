import { Redirect } from "expo-router"
import { Tabs } from "expo-router"
import { Text } from "react-native"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/lib/auth-context"

export default function AppTabs() {
  const { t } = useTranslation("common")
  const { user, loading, pinUnlocked } = useAuth()
  if (!loading && !user) return <Redirect href="/auth/login" />
  if (!loading && user && !pinUnlocked) return <Redirect href="/pin" />

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#F97316",
        tabBarInactiveTintColor: "#6b7280",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="hub"
        options={{
          title: t("nav.hub", { defaultValue: "Hub" }),
          tabBarIcon: () => <Text>⌂</Text>,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: t("nav.transactions", { defaultValue: "Transactions" }),
          tabBarIcon: () => <Text>☰</Text>,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t("nav.more", { defaultValue: "More" }),
          tabBarIcon: () => <Text>⋯</Text>,
        }}
      />
    </Tabs>
  )
}
