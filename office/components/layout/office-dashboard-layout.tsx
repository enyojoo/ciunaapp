"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, LogOut, Menu, X, ChevronRight, Lock, Search } from "lucide-react"
import { BrandLogo } from "@ciuna/shared"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { officeDataStore } from "@/lib/office-data-store"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/lib/permissions"
import { useQueues, type QueueKey } from "@/lib/office-queues"
import { CommandPalette } from "@/components/office/command-palette"
import { NAV_GROUPS, ROLE_LABELS, permissionForPath, type NavGroup, type NavItem } from "@/lib/office-nav"

interface OfficeDashboardLayoutProps {
  children: React.ReactNode
}

function pathMatches(pathname: string | null, href: string, exact?: boolean): boolean {
  if (!pathname) return false
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
}

function RoleChip({ role }: { role: string | null }) {
  if (!role) return null
  return (
    <span
      className="inline-flex items-center rounded-full bg-primary-tint px-2.5 py-0.5 text-xs font-medium text-primary-text"
      data-testid="role-chip"
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}

function CountBadge({ queue }: { queue?: QueueKey }) {
  const { queues, ready } = useQueues()
  const q = queue ? queues[queue] : undefined
  if (!ready || !q || q.unavailable || q.count === 0) return null
  const late = (q.over_sla ?? 0) > 0
  return (
    <span
      data-testid={`count-${queue}`}
      aria-label={`${q.count} waiting${late ? `, ${q.over_sla} over target` : ""}`}
      className={cn("ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium tabular-nums", late ? "bg-warning-surface text-warning-text" : "bg-neutral-surface text-neutral-text")}
    >
      {q.count > 99 ? "99+" : q.count}
    </span>
  )
}

function GroupLinks({ items, pathname, onNavigate }: { items: NavItem[]; pathname: string | null; onNavigate: () => void }) {
  // the longest matching href is the active one, so /fees/settings does not also light up /fees
  const active = items
    .filter((i) => pathMatches(pathname, i.href, i.exact))
    .sort((a, b) => b.href.length - a.href.length)[0]
  return (
    <div className="mt-1 space-y-0.5 border-l border-sidebar-border/80 ml-[1.125rem] pl-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-200",
            active?.href === item.href
              ? "bg-accent text-accent-foreground font-medium"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
          onClick={onNavigate}
        >
          <item.icon className="h-4 w-4 shrink-0 opacity-80" />
          <span className="truncate">{item.name}</span>
          <CountBadge queue={item.queue} />
        </Link>
      ))}
    </div>
  )
}

function NavGroupBlock({ group, items, pathname, open, onToggle, onNavigate }: { group: NavGroup; items: NavItem[]; pathname: string | null; open: boolean; onToggle: () => void; onNavigate: () => void }) {
  const inGroup = items.some((i) => pathMatches(pathname, i.href, i.exact))
  return (
    <div className="pt-1" data-nav-group={group.key}>
      <div className="flex items-center gap-0.5 rounded-md">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground"
          aria-expanded={open}
          aria-label={open ? `Collapse ${group.name} menu` : `Expand ${group.name} menu`}
          onClick={onToggle}
        >
          <ChevronRight className={cn("h-4 w-4 transition-transform", open && "rotate-90")} />
        </Button>
        <Link
          href={items[0].href}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2.5 text-sm font-medium transition-all duration-200",
            inGroup ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
          onClick={onNavigate}
        >
          <group.icon className="h-5 w-5 shrink-0" />
          <span className="truncate">{group.name}</span>
        </Link>
      </div>
      {open ? <GroupLinks items={items} pathname={pathname} onNavigate={onNavigate} /> : null}
    </div>
  )
}

/** Shown in place of a page the signed-in role has no permission for. */
function NoAccessPage({ role }: { role: string | null }) {
  return (
    <div role="status" className="flex flex-col items-center px-6 py-24 text-center" data-testid="no-access">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-surface text-neutral-text">
        <Lock className="h-6 w-6" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold">You do not have access to this page</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {role ? `The ${ROLE_LABELS[role] ?? role} role cannot use this area. ` : ""}Ask a super admin if you need it.
      </p>
      <Button asChild variant="outline" className="mt-5">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  )
}

export function OfficeDashboardLayout({ children }: OfficeDashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const { signOut } = useAuth()
  const perms = usePermissions()
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen((o) => !o) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // while permissions load show every link (the API still enforces); once loaded, hide what the role cannot use
  const groups = NAV_GROUPS.map((g) => ({ group: g, items: g.items.filter((i) => !perms.ready || perms.can(i.permission)) })).filter((g) => g.items.length > 0)

  useEffect(() => {
    const hit = NAV_GROUPS.find((g) => g.items.some((i) => pathMatches(pathname, i.href, i.exact)))
    if (hit) setOpenGroups((o) => (o[hit.key] ? o : { ...o, [hit.key]: true }))
  }, [pathname])

  const needed = permissionForPath(pathname)
  const blocked = perms.ready && needed !== null && !perms.can(needed)
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
  const close = () => setSidebarOpen(false)

  return (
    <div className="flex h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={close} />
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
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={close}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1" aria-label="Office">
            <Link
              href="/dashboard"
              className={`flex items-center w-full px-3 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                pathMatches(pathname, "/dashboard") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
              onClick={close}
            >
              <LayoutDashboard className="mr-3 h-5 w-5 flex-shrink-0" />
              <span className="truncate">Dashboard</span>
            </Link>

            {groups.map(({ group, items }) => (
              <NavGroupBlock
                key={group.key}
                group={group}
                items={items}
                pathname={pathname}
                open={!!openGroups[group.key]}
                onToggle={() => setOpenGroups((o) => ({ ...o, [group.key]: !o[group.key] }))}
                onNavigate={close}
              />
            ))}
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
            <div className="flex flex-1 items-center">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="hidden h-9 w-72 items-center gap-2 rounded-md border bg-background px-3 text-sm text-muted-foreground hover:bg-accent sm:flex"
                aria-label="Search merchants, orders and payouts (Cmd or Ctrl K)"
              >
                <Search className="h-4 w-4" aria-hidden />
                <span className="flex-1 text-left">Search</span>
                <kbd className="rounded border px-1.5 text-xs">⌘K</kbd>
              </button>
              <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Search" onClick={() => setSearchOpen(true)}><Search className="h-5 w-5" /></Button>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {perms.me ? <span className="hidden text-muted-foreground sm:inline">{perms.me.name || perms.me.email}</span> : null}
              <RoleChip role={perms.role} />
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">{blocked ? <NoAccessPage role={perms.role} /> : children}</main>
      </div>
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}
