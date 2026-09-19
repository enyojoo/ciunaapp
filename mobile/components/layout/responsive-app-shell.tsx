import type { ReactNode } from "react"
import { usePathname } from "expo-router"
import { DesktopShell } from "@/components/layout/desktop-shell"
import { useAuth } from "@/lib/auth-context"
import { isAppShellPath, useResponsiveLayout } from "@/lib/responsive-layout"

export function ResponsiveAppShell({ children }: { children: ReactNode }) {
  const { showSidebarShell } = useResponsiveLayout()
  const { user, pinUnlocked } = useAuth()
  const pathname = usePathname()
  const inApp = Boolean(user && pinUnlocked && isAppShellPath(pathname))

  if (!showSidebarShell || !inApp) {
    return <>{children}</>
  }

  return <DesktopShell>{children}</DesktopShell>
}
