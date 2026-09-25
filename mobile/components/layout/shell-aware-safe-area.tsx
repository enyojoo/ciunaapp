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
  const { showSidebarShell } = useResponsiveLayout()

  const resolved = useMemo(() => {
    // Sidebar shell draws its own chrome; don't apply device safe-area there.
    if (showSidebarShell) return ZERO_INSETS
    return insets
  }, [showSidebarShell, insets])

  return <SafeAreaInsetsContext.Provider value={resolved}>{children}</SafeAreaInsetsContext.Provider>
}
