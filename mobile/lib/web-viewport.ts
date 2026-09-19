import { Platform } from "react-native"
import { DESKTOP_MIN_WIDTH } from "@/lib/layout-metrics"

/** RN `useWindowDimensions` is often 0 on the first Expo web paint — read the browser now. */
export function readWebViewport(rnWidth: number, rnHeight: number): { width: number; height: number } {
  if (Platform.OS !== "web") return { width: rnWidth, height: rnHeight }

  let width = rnWidth
  let height = rnHeight
  if (typeof window !== "undefined") {
    width = Math.max(width, window.innerWidth || 0, document.documentElement?.clientWidth || 0)
    height = Math.max(height, window.innerHeight || 0, document.documentElement?.clientHeight || 0)
  }
  if (width < 1) width = DESKTOP_MIN_WIDTH
  if (height < 1) height = 800
  return { width, height }
}
