import { usePathname } from "expo-router"
import { isTabRootPath } from "@/lib/tab-bar-layout"

/** Tail padding for tab scroll content (tab bar inset is on the tab scene). */
export function useTabContentPadding(extra = 24): number {
  const pathname = usePathname()

  if (!isTabRootPath(pathname)) return 40

  // The docked tab bar sits below the scene (the scene has its own bottom padding), so only the extra tail is needed.
  return extra
}
