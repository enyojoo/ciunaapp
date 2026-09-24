import { Platform } from "react-native"
import { TAB_BAR_CONTENT_HEIGHT } from "@/lib/layout-metrics"

const TAB_BAR_PADDING_TOP = 8

const MAIN_TAB_SEGMENTS = new Set(["hub", "transactions", "more"])

export function isMainTabSegment(segment: string | undefined): boolean {
  return segment != null && MAIN_TAB_SEGMENTS.has(segment)
}

export function tabBarBottomInset(insetsBottom: number, webPhoneFrame: boolean): number {
  if (webPhoneFrame) return 14
  if (Platform.OS === "ios") return Math.max(insetsBottom, 6)
  if (Platform.OS === "android") return Math.max(insetsBottom, 8)
  return Math.max(insetsBottom, 8)
}

export function tabBarHeight(insetsBottom: number, webPhoneFrame: boolean): number {
  return (
    TAB_BAR_CONTENT_HEIGHT + TAB_BAR_PADDING_TOP + tabBarBottomInset(insetsBottom, webPhoneFrame)
  )
}

export function tabBarPaddingTop(): number {
  return TAB_BAR_PADDING_TOP
}

/** Scroll content padding so the last row clears the bottom tab bar. */
export function scrollPaddingWithTabBar(insetsBottom: number, webPhoneFrame: boolean, extra = 16): number {
  return tabBarHeight(insetsBottom, webPhoneFrame) + extra
}
