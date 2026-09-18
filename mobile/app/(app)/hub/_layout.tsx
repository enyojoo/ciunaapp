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
        // Branded header for every screen below that opts into headerShown — matches the Experts
        // stack. `headerBackButtonDisplayMode: "minimal"` (chevron-only) also sidesteps the back
        // button otherwise falling back to a screen's raw route name when that screen (hero-shell
        // screens like [slug]/index) never sets its own title.
        headerStyle: { backgroundColor: colors.paper },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[slug]/index" />
      <Stack.Screen name="[slug]/stores" />
      {/* No title — the vendor identity/product title is already big in the body; a repeated header title is redundant. */}
      <Stack.Screen name="[slug]/v/[vendor]" options={{ headerShown: true, title: "" }} />
      <Stack.Screen name="[slug]/p/[productId]" options={{ headerShown: true, title: "" }} />
      <Stack.Screen name="[slug]/cart" options={{ headerShown: true, title: "Cart" }} />
      <Stack.Screen name="[slug]/checkout/index" options={{ headerShown: true, title: "Checkout" }} />
      <Stack.Screen name="[slug]/checkout/[productId]" options={{ headerShown: true, title: "Checkout" }} />
    </Stack>
  )
}
