import { Stack } from "expo-router"
import { colors } from "@/lib/theme"

export default function HubStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        contentStyle: { backgroundColor: colors.paper },
        headerStyle: { backgroundColor: colors.paper },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        animationDuration: 180,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[slug]/index" />
      <Stack.Screen name="[slug]/stores" />
      <Stack.Screen name="[slug]/v/[vendor]" />
      <Stack.Screen name="[slug]/checkout/[productId]" />
    </Stack>
  )
}
