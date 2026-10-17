import {
  MessageSquare, Gauge, UserX,
  Briefcase, Building2, Calendar, Gift, HandHelping, ListChecks, Package, Percent, ScrollText, Settings, Settings2,
  ShieldCheck, ClipboardCheck, Star, Store, TrendingUp, Users, UserCircle, Wallet, CreditCard, ClipboardList, BarChart3,
  type LucideIcon,
} from "lucide-react"

export interface NavItem { name: string; href: string; icon: LucideIcon; permission: string; exact?: boolean; /** queue whose open count shows as a badge */ queue?: "merchants" | "payouts" | "listings" | "kyc" | "transactions" | "support" }
export interface NavGroup { key: string; name: string; icon: LucideIcon; items: NavItem[] }

/**
 * Sidebar groups (OfficeShell card): Operations, Marketplace, Merchants, Finance, Settings.
 * Permission keys are the server's (`api/lib/admin-roles.ts`, served by `GET /api/admin/me`). A group with no visible link disappears.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    key: "operations", name: "Operations", icon: Briefcase,
    items: [
      { name: "Users", href: "/users", icon: Users, permission: "users.read" },
      { name: "KYC", href: "/kyc", icon: ShieldCheck, permission: "users.read", queue: "kyc" },
      { name: "Compliance", href: "/compliance", icon: ClipboardList, permission: "users.read" },
      { name: "Transactions", href: "/transactions", icon: CreditCard, permission: "support.read", queue: "transactions" },
      { name: "Assistant", href: "/assistant", icon: HandHelping, permission: "support.read", queue: "support" },
      { name: "Support requests", href: "/support", icon: MessageSquare, permission: "support.read" },
      { name: "Account deletions", href: "/deletions", icon: UserX, permission: "users.read" },
    ],
  },
  {
    key: "marketplace", name: "Marketplace", icon: Store,
    items: [
      { name: "Orders", href: "/marketplace", icon: Package, permission: "orders.manage" },
      { name: "Catalog review", href: "/catalog-review", icon: ClipboardCheck, permission: "listings.review", queue: "listings" },
      { name: "Bookings", href: "/bookings", icon: Calendar, permission: "support.read" },
      { name: "Reviews", href: "/reviews", icon: Star, permission: "merchants.read" },
      { name: "Food products", href: "/food/products", icon: Package, permission: "catalog.manage" },
      { name: "Food vendors", href: "/food/vendors", icon: Store, permission: "catalog.manage" },
      { name: "Mart products", href: "/mart/products", icon: Package, permission: "catalog.manage" },
      { name: "Mart vendors", href: "/mart/vendors", icon: Store, permission: "catalog.manage" },
    ],
  },
  {
    key: "merchants", name: "Merchants", icon: Building2,
    items: [
      { name: "Applications", href: "/merchants", icon: Building2, permission: "merchants.read", queue: "merchants" },
      { name: "KYB requirements", href: "/kyb", icon: ListChecks, permission: "kyb.manage" },
      { name: "Expert profiles", href: "/experts/profiles", icon: UserCircle, permission: "experts.manage" },
      { name: "Expert services", href: "/experts/services", icon: Package, permission: "experts.manage" },
      { name: "Audit log", href: "/audit", icon: ScrollText, permission: "audit.read" },
    ],
  },
  {
    key: "finance", name: "Finance", icon: Wallet,
    items: [
      { name: "Payouts", href: "/finance/payouts", icon: Wallet, permission: "finance.manage", queue: "payouts" },
      { name: "Fees and commissions", href: "/fees", icon: Percent, permission: "finance.manage", exact: true },
      { name: "Marketplace money settings", href: "/fees/settings", icon: Settings2, permission: "finance.manage" },
      { name: "Referrals", href: "/referrals", icon: Gift, permission: "finance.manage" },
      { name: "Analytics", href: "/analytics", icon: BarChart3, permission: "finance.manage" },
    ],
  },
  {
    key: "settings", name: "Settings", icon: Settings,
    items: [
      { name: "Rates", href: "/rates", icon: TrendingUp, permission: "rates.manage" },
      { name: "Send limits", href: "/limits", icon: Gauge, permission: "settings.manage" },
      { name: "Settings", href: "/settings", icon: Settings, permission: "settings.manage" },
    ],
  },
]

/** Permission a top-level route needs. Longest matching prefix wins; routes not listed need only an admin session. */
const ROUTE_PERMISSIONS: Array<[string, string]> = [
  ["/users", "users.read"], ["/deletions", "users.read"], ["/kyc", "users.read"], ["/compliance", "users.read"],
  ["/transactions", "support.read"], ["/assistant", "support.read"], ["/support", "support.read"], ["/orders", "support.read"],
  ["/marketplace", "orders.manage"], ["/bookings", "support.read"], ["/reviews", "merchants.read"], ["/catalog-review", "listings.review"],
  ["/food", "catalog.manage"], ["/mart", "catalog.manage"], ["/products", "catalog.manage"],
  ["/merchants", "merchants.read"], ["/kyb", "kyb.manage"], ["/experts", "experts.manage"], ["/audit", "audit.read"],
  ["/finance", "finance.manage"], ["/fees", "finance.manage"], ["/referrals", "finance.manage"], ["/analytics", "finance.manage"],
  ["/rates", "rates.manage"], ["/settings", "settings.manage"], ["/limits", "settings.manage"],
]

export function permissionForPath(pathname: string | null): string | null {
  if (!pathname) return null
  let best: [string, string] | null = null
  for (const r of ROUTE_PERMISSIONS) {
    if ((pathname === r[0] || pathname.startsWith(r[0] + "/")) && (!best || r[0].length > best[0].length)) best = r
  }
  return best ? best[1] : null
}

export const ROLE_LABELS: Record<string, string> = { ops: "Ops", support: "Support", finance: "Finance", compliance: "Compliance", super_admin: "Super admin" }
