import { usePathname } from "expo-router"
import { Platform } from "react-native"
import { isTabRootPath } from "@/lib/tab-bar-layout"

/** Tail padding for tab scroll content (tab bar inset is on the tab scene). */
export function useTabContentPadding(extra = 24): number {
  const pathname = usePathname()

  if (!isTabRootPath(pathname)) return 40

  // The iOS system tab bar floats over the content, so the last row needs to clear it.
  return Platform.OS === "ios" ? extra + 96 : extra
}
