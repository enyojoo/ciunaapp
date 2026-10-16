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
  "/analytics",
  "/rates",
]

function isProtectedPath(pathname: string | null): boolean {
  if (!pathname) return false
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

function settingsPath(pathname: string | null): boolean {
  if (!pathname) return false
  return pathname === "/settings" || pathname.startsWith("/settings/")
}

export function ProtectedRouteWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const requireSuperAdmin = settingsPath(pathname)
  const { isChecking } = useRouteProtection({
    requireAuth: true,
    adminOnly: true,
    requireSuperAdmin,
    redirectTo: "/auth/login",
    forbiddenRedirectTo: "/dashboard",
  })

  if (!isProtectedPath(pathname)) {
    return <>{children}</>
  }

  if (isChecking) {
    return <OfficeAuthLoadingSkeleton />
  }

  return <>{children}</>
}
