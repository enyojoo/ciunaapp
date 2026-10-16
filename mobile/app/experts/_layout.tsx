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
      {/* These screens draw the shared hub top bar themselves, so the native header stays off. */}
      <Stack.Screen name="[slug]" />
      <Stack.Screen name="s/[serviceId]" />
      <Stack.Screen name="book/[serviceId]" />
    </Stack>
  )
}
