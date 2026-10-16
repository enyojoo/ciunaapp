"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { useTranslation } from "react-i18next"
import { useRouteProtection } from "@/hooks/use-route-protection"
import { useMediaQueryMinLg } from "@/hooks/use-media-query"
import { AuthLoadingSkeleton } from "@/components/auth-loading-skeleton"
import { UserDashboardLayout } from "@/components/layout/user-dashboard-layout"
import { useAuth } from "@/lib/auth-context"
import { readLastKnownUserId } from "@/lib/last-user-id"

/** Keeps `useTranslation` off public routes (e.g. `/[referralSlug]`) so SSR/build does not warn NO_I18NEXT_INSTANCE. */
function AdminAccessDeniedScreen() {
  const { t } = useTranslation("app")
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t("layout.accessDenied")}</h1>
        <p className="text-gray-600 mb-4">{t("layout.adminCannotAccessUser")}</p>
        <a
          href="/admin/dashboard"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
        >
          {t("layout.goToAdminDashboard")}
        </a>
      </div>
    </div>
  )
}

const PROTECTED_PATHS = ["/hub", "/send", "/transactions", "/assistant", "/recipients", "/more", "/support"]

/** Published expert profile at `/experts/[slug]` (browse without login; UUID in the path still works). */
function isPublicExpertProfilePathname(pathname: string): boolean {
  const m = pathname.match(/^\/experts\/([^/]+)$/)
  if (!m) return false
  const seg = m[1].toLowerCase()
  if (seg === "checkout") return false
  return true
}

/** Public vendor storefront: `/food/v/...`, `/mart/v/...` */
function isVendorStorefrontPath(pathname: string): boolean {
  return /^\/(food|mart)\/v\//.test(pathname)
}

/** Sidebar + top bar (same chrome as `/send`). Includes `/food/v/*` & `/mart/v/*` storefronts (public or signed-in). */
function usesUserDashboardLayoutPathname(pathname: string | null): boolean {
  if (!pathname) return false
  if (pathname.startsWith("/auth/")) return false

  if (isPublicExpertProfilePathname(pathname)) return false

  /** Experts line subroutes (`/experts/browse`, book, checkout) — not bare `/experts/[slug]` profile (excluded above). */
  if (pathname.startsWith("/experts/")) return true

  if (pathname.startsWith("/admin")) return true

  if (PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true

  if (pathname === "/food" || pathname.startsWith("/food/")) return true
  if (pathname === "/mart" || pathname.startsWith("/mart/")) return true

  if (pathname === "/experts") return true

  return false
}

/** Logged-in desktop: expert profiles sit in the hub shell like `/mart/v/*`; guests and mobile stay full-width. */
function usesDashboardForExpertProfile(pathname: string | null, user: unknown, isLg: boolean): boolean {
  return Boolean(user && isLg && pathname && isPublicExpertProfilePathname(pathname))
}

function usesUserDashboardLayout(
  pathname: string | null,
  opts: { user: unknown; isLg: boolean },
): boolean {
  return usesDashboardForExpertProfile(pathname, opts.user, opts.isLg) || usesUserDashboardLayoutPathname(pathname)
}

/** Only these routes should trigger "must be logged in → redirect to /auth/login" in the wrapper. */
function requiresProtectedAuth(pathname: string | null): boolean {
  if (!pathname) return false
  if (pathname.startsWith("/auth/")) return false

  if (isVendorStorefrontPath(pathname)) return false
  if (isPublicExpertProfilePathname(pathname)) return false

  if (pathname.startsWith("/admin")) return true

  if (pathname === "/experts") return true

  if (PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true

  if (pathname.startsWith("/experts/")) return true

  if (pathname === "/food" || (pathname.startsWith("/food/") && !pathname.startsWith("/food/v/"))) return true
  if (pathname === "/mart" || (pathname.startsWith("/mart/") && !pathname.startsWith("/mart/v/"))) return true

  return false
}

export function ProtectedRouteWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const isLg = useMediaQueryMinLg()
  const { isChecking, isAdmin } = useRouteProtection({
    requireAuth: requiresProtectedAuth(pathname),
  })
  /**
   * Captured once on mount so a returning device (we've seen a session here
   * before) skips the full-screen `AuthLoadingSkeleton` while the auth
   * provider re-bootstraps via `supabase.auth.getSession()` + the users-table
   * fetch. Without this the cached page UI we paint in `useLayoutEffect`
   * (transactions detail, food/mart, etc.) is masked by a spinner on every
   * navigation, producing the visible blink.
   *
   * If the route turns out to require auth and the session genuinely no
   * longer exists, `useRouteProtection` will redirect to `/auth/login` from
   * its effect; the brief cached paint is from this device's own storage.
   */
  const [hasReturningSession] = useState(() => readLastKnownUserId() != null)

  if (!usesUserDashboardLayout(pathname, { user, isLg })) {
    return <>{children}</>
  }

  if (isChecking && !hasReturningSession) {
    return <AuthLoadingSkeleton />
  }

  if (isAdmin) {
    return <AdminAccessDeniedScreen />
  }

  return <UserDashboardLayout>{children}</UserDashboardLayout>
}
