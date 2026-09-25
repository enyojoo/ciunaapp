import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { StackBackButton } from "@/components/stack-back-button"
import { colors } from "@/lib/theme"

export const unstable_settings = {
  initialRouteName: "index",
}

export default function HubStack() {
  const { t } = useTranslation("app")
  const back = t("common.back", { defaultValue: "Back" })
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
        headerBackVisible: false,
        headerLeft: () => <StackBackButton label={back} />,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[slug]/index" />
      <Stack.Screen name="[slug]/stores" />
      <Stack.Screen
        name="[slug]/v/[vendor]"
        options={{ headerShown: true, title: "", headerBackVisible: false, headerLeft: () => <StackBackButton label={back} /> }}
      />
      <Stack.Screen
        name="[slug]/p/[productId]"
        options={{ headerShown: true, title: "", headerBackVisible: false, headerLeft: () => <StackBackButton label={back} /> }}
      />
      <Stack.Screen
        name="[slug]/cart"
        options={{
          headerShown: true,
          title: t("marketplace.cart", { defaultValue: "Cart" }),
          headerBackVisible: false,
          headerLeft: () => <StackBackButton label={back} />,
        }}
      />
      <Stack.Screen
        name="[slug]/checkout/index"
        options={{
          headerShown: true,
          title: t("marketplace.checkout", { defaultValue: "Checkout" }),
          headerBackVisible: false,
          headerLeft: () => <StackBackButton label={back} />,
        }}
      />
      <Stack.Screen
        name="[slug]/checkout/[productId]"
        options={{
          headerShown: true,
          title: t("marketplace.checkout", { defaultValue: "Checkout" }),
          headerBackVisible: false,
          headerLeft: () => <StackBackButton label={back} />,
        }}
      />
    </Stack>
  )
}
