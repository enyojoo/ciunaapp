import type { ReactNode } from "react"
import { usePathname } from "expo-router"
import { DesktopShell } from "@/components/layout/desktop-shell"
import { useAuth } from "@/lib/auth-context"
import { isAppShellPath, useResponsiveLayout } from "@/lib/responsive-layout"

export function ResponsiveAppShell({ children }: { children: ReactNode }) {
  const { showSidebarShell } = useResponsiveLayout()
  const { user } = useAuth()
  const pathname = usePathname()

  if (!showSidebarShell || !user || !isAppShellPath(pathname)) {
    return <>{children}</>
  }

  return <DesktopShell>{children}</DesktopShell>
}
