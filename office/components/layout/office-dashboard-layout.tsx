"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  CreditCard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Gift,
  Store,
  HandHelping,
  UserCircle,
  ChevronRight,
  Package,
  Calendar,
  Briefcase,
} from "lucide-react"
import { BrandLogo } from "@ciuna/shared"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { officeDataStore } from "@/lib/office-data-store"
import { hubProductsPath, hubVendorsPath } from "@/lib/hub-office-paths"
import { cn } from "@/lib/utils"

interface OfficeDashboardLayoutProps {
  children: React.ReactNode
}

const baseNavigation = [
  { name: "Users", href: "/users", icon: Users },
  { name: "Referrals", href: "/referrals", icon: Gift },
  { name: "Compliance", href: "/compliance", icon: ShieldCheck },
  { name: "Settings", href: "/settings", icon: Settings },
]

function hubPathActive(pathname: string | null, prefix: string): boolean {
  if (!pathname) return false
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function HubSectionSubnav({ pathname, onNavigate }: { pathname: string | null; onNavigate: () => void }) {
  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-200",
      active
        ? "bg-accent text-accent-foreground font-medium"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
    )

  return (
    <div className="mt-1 space-y-0.5 border-l border-sidebar-border/80 ml-[1.125rem] pl-2">
      <p className="px-3 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Food
      </p>
      <Link
        href={hubProductsPath("food")}
        className={linkClass(hubPathActive(pathname, hubProductsPath("food")))}
        onClick={onNavigate}
      >
        <Package className="h-4 w-4 shrink-0 opacity-80" />
        <span className="truncate">Products</span>
      </Link>
      <Link
        href={hubVendorsPath("food")}
        className={linkClass(hubPathActive(pathname, hubVendorsPath("food")))}
        onClick={onNavigate}
      >
        <Store className="h-4 w-4 shrink-0 opacity-80" />
        <span className="truncate">Vendors</span>
      </Link>

      <p className="px-3 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Mart
      </p>
      <Link
        href={hubProductsPath("mart")}
        className={linkClass(hubPathActive(pathname, hubProductsPath("mart")))}
        onClick={onNavigate}
      >
        <Package className="h-4 w-4 shrink-0 opacity-80" />
        <span className="truncate">Products</span>
      </Link>
      <Link
        href={hubVendorsPath("mart")}
        className={linkClass(hubPathActive(pathname, hubVendorsPath("mart")))}
        onClick={onNavigate}
      >
        <Store className="h-4 w-4 shrink-0 opacity-80" />
        <span className="truncate">Vendors</span>
      </Link>

      <p className="px-3 pt-3 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Experts
      </p>
      <Link
        href="/experts/profiles"
        className={linkClass(hubPathActive(pathname, "/experts/profiles"))}
        onClick={onNavigate}
      >
        <UserCircle className="h-4 w-4 shrink-0 opacity-80" />
        <span className="truncate">Profiles</span>
      </Link>
      <Link
        href="/experts/services"
        className={linkClass(hubPathActive(pathname, "/experts/services"))}
        onClick={onNavigate}
      >
        <Package className="h-4 w-4 shrink-0 opacity-80" />
        <span className="truncate">Services</span>
      </Link>
    </div>
  )
}

function OperationsSectionSubnav({
  pathname,
  onNavigate,
}: {
  pathname: string | null
  onNavigate: () => void
}) {
  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-200",
      active
        ? "bg-accent text-accent-foreground font-medium"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
    )

  return (
    <div className="mt-1 space-y-0.5 border-l border-sidebar-border/80 ml-[1.125rem] pl-2">
      <Link
        href="/marketplace"
        className={linkClass(Boolean(pathname?.startsWith("/marketplace")))}
        onClick={onNavigate}
      >
        <Package className="h-4 w-4 shrink-0 opacity-80" />
        <span>Marketplace orders</span>
      </Link>
      <Link
        href="/transactions"
        className={linkClass(pathname === "/transactions" || Boolean(pathname?.startsWith("/transactions/")))}
        onClick={onNavigate}
      >
        <CreditCard className="h-4 w-4 shrink-0 opacity-80" />
        <span className="truncate">Transactions</span>
      </Link>
      <Link
        href="/assistant"
        className={linkClass(pathname === "/assistant" || Boolean(pathname?.startsWith("/assistant/")))}
        onClick={onNavigate}
      >
        <HandHelping className="h-4 w-4 shrink-0 opacity-80" />
        <span className="truncate">Assistant</span>
      </Link>
      <Link
        href="/bookings"
        className={linkClass(pathname === "/bookings" || Boolean(pathname?.startsWith("/bookings/")))}
        onClick={onNavigate}
      >
        <Calendar className="h-4 w-4 shrink-0 opacity-80" />
        <span className="truncate">Bookings</span>
      </Link>
    </div>
  )
}

function isHubSectionPath(pathname: string | null): boolean {
  if (!pathname) return false
  return (
    pathname.startsWith("/food/") ||
    pathname.startsWith("/mart/") ||
    pathname.startsWith("/products/") ||
    pathname === "/experts" ||
    pathname.startsWith("/experts/")
  )
}

function isOperationsSectionPath(pathname: string | null): boolean {
  if (!pathname) return false
  return (
    pathname === "/transactions" ||
    pathname.startsWith("/transactions/") ||
    pathname === "/assistant" ||
    pathname.startsWith("/assistant/") ||
    pathname === "/bookings" ||
    pathname.startsWith("/bookings/")
  )
}

export function OfficeDashboardLayout({ children }: OfficeDashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hubNavOpen, setHubNavOpen] = useState(false)
  const [operationsNavOpen, setOperationsNavOpen] = useState(false)
  const { signOut, isSuperAdmin } = useAuth()

  const navigation = isSuperAdmin
    ? baseNavigation
    : baseNavigation.filter((item) => item.href !== "/settings")

  useEffect(() => {
    if (isHubSectionPath(pathname)) {
      setHubNavOpen(true)
      setOperationsNavOpen(false)
    } else if (isOperationsSectionPath(pathname)) {
      setOperationsNavOpen(true)
      setHubNavOpen(false)
    }
  }, [pathname])

  const handleLogout = async () => {
    try {
      officeDataStore.clearDataCache()
      officeDataStore.destroy()
      await signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/auth/login")
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-56 border-r bg-sidebar flex flex-col transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex flex-col h-full w-full">
          <div className="flex items-center justify-between px-6 h-16 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <BrandLogo size="sm" />
              <span className="text-sm text-primary font-medium">Office</span>
            </div>
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
            <Link
              href="/dashboard"
              className={`flex items-center w-full px-3 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                pathname === "/dashboard" || Boolean(pathname?.startsWith("/dashboard/"))
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <LayoutDashboard className="mr-3 h-5 w-5 flex-shrink-0" />
              <span className="truncate">Dashboard</span>
            </Link>

            <div className="pt-1">
              <div className="flex items-center gap-0.5 rounded-md">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-muted-foreground"
                  aria-expanded={operationsNavOpen}
                  aria-label={operationsNavOpen ? "Collapse Operations menu" : "Expand Operations menu"}
                  onClick={() => setOperationsNavOpen((o) => !o)}
                >
                  <ChevronRight
                    className={cn("h-4 w-4 transition-transform", operationsNavOpen && "rotate-90")}
                  />
                </Button>
                <Link
                  href="/transactions"
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2.5 text-sm font-medium transition-all duration-200",
                    isOperationsSectionPath(pathname)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Briefcase className="h-5 w-5 shrink-0" />
                  <span className="truncate">Operations</span>
                </Link>
              </div>

              {operationsNavOpen ? (
                <OperationsSectionSubnav pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
              ) : null}
            </div>

            <div className="pt-1">
              <div className="flex items-center gap-0.5 rounded-md">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-muted-foreground"
                  aria-expanded={hubNavOpen}
                  aria-label={hubNavOpen ? "Collapse Hub menu" : "Expand Hub menu"}
                  onClick={() => setHubNavOpen((o) => !o)}
                >
                  <ChevronRight className={cn("h-4 w-4 transition-transform", hubNavOpen && "rotate-90")} />
                </Button>
                <Link
                  href={hubProductsPath("food")}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2.5 text-sm font-medium transition-all duration-200",
                    isHubSectionPath(pathname)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Store className="h-5 w-5 shrink-0" />
                  <span className="truncate">Hub</span>
                </Link>
              </div>

              {hubNavOpen ? (
                <HubSectionSubnav pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
              ) : null}
            </div>

            {navigation.map((item) => {
              const isActive = pathname === item.href || Boolean(pathname?.startsWith(item.href + "/"))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center w-full px-3 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
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

          <div className="px-3 py-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-accent-foreground hover:bg-accent px-3 py-3"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
              <span className="truncate">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-56">
        <div className="bg-background border-b border-sidebar-border px-4 h-16 flex items-center sm:px-6 lg:px-8">
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1"></div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
