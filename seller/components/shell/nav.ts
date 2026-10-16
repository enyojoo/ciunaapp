import { Home, ClipboardList, Package, Wallet, CalendarCheck, Briefcase, Clock, MessageSquare, Menu, Star, type LucideIcon } from "lucide-react"

export interface NavItem { href: string; labelKey: string; icon: LucideIcon; permission?: string; primary?: boolean; ready: boolean }

/** `ready` flips to true when a section's pages ship; keeps the shell honest about what exists. */
export function navFor(type: "store" | "expert"): NavItem[] {
  const common: NavItem[] = [{ href: "/", labelKey: "nav.home", icon: Home, primary: true, ready: true }]
  const store: NavItem[] = [
    { href: "/orders", labelKey: "nav.orders", icon: ClipboardList, permission: "orders", primary: true, ready: true },
    { href: "/messages", labelKey: "nav.messages", icon: MessageSquare, permission: "messages", primary: true, ready: true },
    { href: "/catalog", labelKey: "nav.catalog", icon: Package, permission: "catalog", primary: true, ready: true },
    { href: "/earnings", labelKey: "nav.earnings", icon: Wallet, permission: "earnings", primary: false, ready: true },
    { href: "/reviews", labelKey: "reviews.nav", icon: Star, permission: "orders", primary: false, ready: true },
  ]
  const expert: NavItem[] = [
    { href: "/bookings", labelKey: "nav.bookings", icon: CalendarCheck, permission: "orders", primary: true, ready: true },
    { href: "/messages", labelKey: "nav.messages", icon: MessageSquare, permission: "messages", primary: true, ready: true },
    { href: "/services", labelKey: "nav.services", icon: Briefcase, permission: "catalog", primary: true, ready: true },
    { href: "/availability", labelKey: "nav.availability", icon: Clock, permission: "availability", primary: false, ready: true },
    { href: "/earnings", labelKey: "nav.earnings", icon: Wallet, permission: "earnings", primary: false, ready: true },
    { href: "/reviews", labelKey: "reviews.nav", icon: Star, permission: "orders", primary: false, ready: true },
  ]
  return [...common, ...(type === "store" ? store : expert)]
}

export const MORE_ITEM = { href: "/more", labelKey: "nav.more", icon: Menu }
