"use client"

import type React from "react"
import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, LayoutDashboard, History, LogIn, LogOut, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { BrandLogo } from "@/components/brand/brand-logo"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { AppLockProvider } from "@/components/app-lock/app-lock-provider"
import { HubReferSupportActions } from "@/components/hub/hub-refer-support-actions"

interface UserDashboardLayoutProps {
  children: React.ReactNode
}

export function UserDashboardLayout({ children }: UserDashboardLayoutProps) {
  const { t } = useTranslation("common")
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, signOut } = useAuth()

  const showHubHeaderActions =
    pathname === "/hub" ||
    Boolean(pathname?.startsWith("/hub/")) ||
    pathname === "/food" ||
    Boolean(pathname?.startsWith("/food/")) ||
    pathname === "/mart" ||
    Boolean(pathname?.startsWith("/mart/")) ||
    pathname === "/experts" ||
    Boolean(pathname?.startsWith("/experts/"))

  const baseNavigation = useMemo(
    () => [
      { name: t("nav.hub"), href: "/hub", icon: Home },
      { name: t("nav.activities"), href: "/activities", icon: History },
      { name: t("nav.more"), href: "/more", icon: LayoutDashboard },
    ],
    [t],
  )

  const bottomNavItems = useMemo(
    () => [
      { name: t("nav.hub"), href: "/hub", icon: Home },
      { name: t("nav.activities"), href: "/activities", icon: History },
      { name: t("nav.more"), href: "/more", icon: LayoutDashboard },
    ],
    [t],
  )

  const handleLogout = async () => {
    await signOut()
    router.push("/auth/login")
  }

  return (
    <AppLockProvider>
    <div className="flex h-dvh min-h-0 bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Desktop Sidebar - business style: fixed w-56, bg-sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-56 border-r bg-sidebar transform transition-transform duration-300 ease-in-out lg:translate-x-0 hidden lg:flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex flex-col h-full w-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 h-16 border-b border-sidebar-border">
            <BrandLogo size="md" />
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1">
            {baseNavigation.map((item) => {
              const isActive =
                item.href === "/hub"
                  ? pathname === "/hub" ||
                    Boolean(pathname?.startsWith("/hub/")) ||
                    pathname === "/food" ||
                    Boolean(pathname?.startsWith("/food/")) ||
                    pathname === "/mart" ||
                    Boolean(pathname?.startsWith("/mart/")) ||
                    pathname === "/experts" ||
                    Boolean(pathname?.startsWith("/experts/"))
                  : item.href === "/activities"
                    ? pathname === "/activities" || Boolean(pathname?.startsWith("/activities/"))
                    : pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={`flex items-center w-full px-3 py-3 text-sm font-medium md:text-[0.9375rem] rounded-md transition-all duration-200 ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Log in (guest) / Log out (session) — desktop sidebar only; mobile uses bottom nav + auth pages */}
          <div className="px-3 py-4 border-t border-sidebar-border">
            {user ? (
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-3"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
                <span className="truncate">{t("nav.logout")}</span>
              </Button>
            ) : (
              <Button asChild variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-3">
                <Link href="/auth/login" prefetch={true}>
                  <LogIn className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{t("nav.login", { defaultValue: "Log in" })}</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main content area - ml-56 for desktop; max-width column on wide screens for app-like density */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:ml-56">
        {/* Top bar - Desktop only: Hub routes show refer + support (logo is in sidebar). */}
        <div className="hidden h-16 w-full shrink-0 items-center justify-end gap-2 border-b border-sidebar-border bg-background px-4 sm:px-6 lg:px-8 lg:flex">
          {showHubHeaderActions ? (
            user ? (
              <HubReferSupportActions />
            ) : (
              <Button asChild variant="outline" size="sm" className="font-medium">
                <Link href="/auth/login">{t("nav.login", { defaultValue: "Log in" })}</Link>
              </Button>
            )
          ) : null}
        </div>

        {/* Page content */}
        <main className="mx-auto min-h-0 min-w-0 w-full max-w-3xl flex-1 overflow-x-clip overflow-y-auto overscroll-x-contain pb-app-main-mobile md:max-w-4xl lg:mx-0 lg:max-w-none lg:pb-0 xl:px-3 2xl:px-8">
          {children}
        </main>

        {/* Bottom Navigation - Mobile/Tablet only */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border lg:hidden z-40 pb-safe">
          <div className="flex w-full items-center justify-around px-2 py-2 sm:px-4 sm:py-2.5">
            {bottomNavItems.map((item) => {
              const isActive =
                item.href === "/hub"
                  ? pathname === "/hub" ||
                    Boolean(pathname?.startsWith("/hub/")) ||
                    pathname === "/food" ||
                    Boolean(pathname?.startsWith("/food/")) ||
                    pathname === "/mart" ||
                    Boolean(pathname?.startsWith("/mart/")) ||
                    pathname === "/experts" ||
                    Boolean(pathname?.startsWith("/experts/"))
                  : item.href === "/activities"
                    ? pathname === "/activities" || Boolean(pathname?.startsWith("/activities/"))
                    : item.href === "/more"
                      ? pathname === "/more" || Boolean(pathname?.startsWith("/more/"))
                      : pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className="flex flex-col items-center justify-center p-2 min-w-0 flex-1"
                >
                  <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-gray-600"}`} />
                  <span
                    className={`mt-1 max-w-[5.25rem] truncate text-center text-xs leading-tight sm:max-w-none sm:text-[0.8125rem] ${isActive ? "text-primary" : "text-gray-600"}`}
                  >
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
    </AppLockProvider>
  )
}
