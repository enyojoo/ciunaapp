import { Platform } from "react-native"
import { colors, radius } from "@/lib/theme"

/**
 * Screen options for a route that opens as a native form sheet (picker, cart, product on a store, filters). On iOS
 * and Android it is the system sheet with a grabber and detents; on web it falls back to a modal.
 *
 * Use on a `Stack.Screen`: `options={sheetOptions()}` or `sheetOptions({ detents: [0.5, 1] })`. Lists inside a
 * sheet that should scroll with it need `contentInsetAdjustmentBehavior="automatic"` on the ScrollView.
 */
export function sheetOptions({
  detents = "fitToContents",
  grabber = true,
}: {
  /** Fractions of the screen height, ascending, or `fitToContents` to hug the content. */
  detents?: number[] | "fitToContents"
  grabber?: boolean
} = {}) {
  return {
    presentation: Platform.OS === "web" ? ("modal" as const) : ("formSheet" as const),
    headerShown: false,
    gestureEnabled: true,
    sheetAllowedDetents: detents,
    sheetGrabberVisible: grabber,
    sheetCornerRadius: radius.sheet,
    contentStyle: { backgroundColor: colors.surface },
  }
}
