import { Stack } from "expo-router"
import { colors } from "@/lib/theme"

export const unstable_settings = {
  initialRouteName: "index",
}

export default function HubStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        contentStyle: { backgroundColor: colors.paper },
        animationDuration: 180,
        headerStyle: { backgroundColor: colors.paper },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[slug]/index" />
      <Stack.Screen name="[slug]/stores" />
      <Stack.Screen name="[slug]/c/[category]" />
      <Stack.Screen
        name="[slug]/v/[vendor]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="[slug]/p/[productId]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="[slug]/cart"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="[slug]/checkout/index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="[slug]/checkout/[productId]"
        options={{ headerShown: false }}
      />
    </Stack>
  )
}
