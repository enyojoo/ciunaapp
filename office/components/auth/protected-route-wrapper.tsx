"use client"

import { usePathname } from "next/navigation"
import { useRouteProtection } from "@/hooks/use-route-protection"
import { OfficeAuthLoadingSkeleton } from "@/components/office-auth-loading-skeleton"

const PROTECTED_PATHS = [
  "/dashboard",
  "/food",
  "/mart",
  "/products",
  "/assistant",
  "/experts",
  "/bookings",
  "/kyc",
  "/compliance",
  "/users",
  "/settings",
  "/transactions",
  "/orders",
  "/referrals",
  "/marketplace",
  "/merchants",
  "/kyb",
  "/finance",
  "/fees",
  "/audit",
  "/reviews",
  "/support",
  "/catalog-review",
  "/analytics",
  "/rates",
  "/limits",
  "/deletions",
]

function isProtectedPath(pathname: string | null): boolean {
  if (!pathname) return false
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

export function ProtectedRouteWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Who may open a page is decided by the layout guard (`permissionForPath` in lib/office-nav.ts: /settings needs
  // settings.manage), which shows the no-access screen. Redirecting here sent non-super-admins to the dashboard instead.
  const { isChecking } = useRouteProtection({
    requireAuth: true,
    adminOnly: true,
    redirectTo: "/auth/login",
  })

  if (!isProtectedPath(pathname)) {
    return <>{children}</>
  }

  if (isChecking) {
    return <OfficeAuthLoadingSkeleton />
  }

  return <>{children}</>
}
