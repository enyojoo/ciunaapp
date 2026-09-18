import { Stack } from "expo-router"
import { colors } from "@/lib/theme"

export default function ExpertsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.paper },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.paper },
        animationDuration: 180,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Experts" }} />
      <Stack.Screen name="[slug]" options={{ title: "" }} />
      <Stack.Screen name="book/[serviceId]" options={{ title: "Book" }} />
    </Stack>
  )
}
