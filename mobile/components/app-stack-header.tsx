import type { ReactNode } from "react"
import { View } from "react-native"
import { HubTopBar } from "@/components/hub-top-bar"
import { colors } from "@/lib/theme"

type HeaderProps = {
  options: {
    title?: string
    headerRight?: (props: { canGoBack?: boolean; tintColor?: string }) => ReactNode
  }
  back?: unknown
}

/**
 * The stack header for every screen that shows one: the same top bar as Food and Mart (back chip, optional
 * title, actions on the right). Set as `header` in a Stack's screenOptions so screens only choose a title
 * and, if they need one, a headerRight action.
 */
export function AppStackHeader({ options, back }: HeaderProps) {
  const title = typeof options.title === "string" ? options.title : ""
  const right = options.headerRight ? options.headerRight({ canGoBack: Boolean(back) }) : null
  // The 16px under the bar matches the space the hub screens add themselves.
  return (
    <View style={{ paddingBottom: 16, backgroundColor: colors.paper }}>
      <HubTopBar title={title || undefined} trailing={right} />
    </View>
  )
}
