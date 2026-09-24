import { useMemo, type ReactNode } from "react"
import {
  SafeAreaInsetsContext,
  useSafeAreaInsets,
  type EdgeInsets,
} from "react-native-safe-area-context"
import { useResponsiveLayout } from "@/lib/responsive-layout"

const ZERO_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 }

export function ShellAwareSafeArea({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets()
  const { showSidebarShell, isWeb, mode } = useResponsiveLayout()

  const resolved = useMemo(() => {
    if (showSidebarShell) return ZERO_INSETS
    // Mobile web phone frame: avoid browser/env safe-area doubling inside device chrome.
    if (isWeb && mode === "mobile") return ZERO_INSETS
    return insets
  }, [showSidebarShell, isWeb, mode, insets])

  return <SafeAreaInsetsContext.Provider value={resolved}>{children}</SafeAreaInsetsContext.Provider>
}
