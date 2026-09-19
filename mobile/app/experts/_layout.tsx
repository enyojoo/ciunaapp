import { Stack } from "expo-router"
import { colors } from "@/lib/theme"

export default function ExpertsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerStyle: { backgroundColor: colors.paper },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: colors.paper },
        animationDuration: 180,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="browse" />
      {/* No title — same reasoning as the vendor storefront: the expert's name is already big in the body. */}
      <Stack.Screen name="[slug]" options={{ headerShown: true, title: "" }} />
      <Stack.Screen name="s/[serviceId]" options={{ headerShown: true, title: "" }} />
      <Stack.Screen name="book/[serviceId]" options={{ headerShown: true, title: "Book" }} />
    </Stack>
  )
}
