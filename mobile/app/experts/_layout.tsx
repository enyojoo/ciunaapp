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
        contentStyle: { backgroundColor: colors.paper },
        animationDuration: 180,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="browse" />
      <Stack.Screen name="[slug]" />
      <Stack.Screen name="book/[serviceId]" options={{ headerShown: true, title: "Book" }} />
    </Stack>
  )
}
