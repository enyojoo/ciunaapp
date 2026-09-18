import { Stack } from "expo-router"
import { colors } from "@/lib/theme"

export default function HubStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        contentStyle: { backgroundColor: colors.paper },
        animationDuration: 180,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[slug]/index" />
      <Stack.Screen name="[slug]/stores" />
      <Stack.Screen name="[slug]/v/[vendor]" />
      <Stack.Screen name="[slug]/checkout/[productId]" options={{ headerShown: true, title: "Checkout" }} />
    </Stack>
  )
}
