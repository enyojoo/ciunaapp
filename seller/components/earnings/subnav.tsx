"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@ciuna/ui-web"
import { useSeller } from "@/lib/session"
import { useT } from "@/lib/i18n"

/** Earnings / Payouts / Payout methods. Payout pages are for owner and finance only. */
export function EarningsSubnav() {
  const pathname = usePathname()
  const { can } = useSeller()
  const { t } = useT()
  const items = [
    { href: "/earnings", label: t("earnings.nav.overview"), show: can("earnings") },
    { href: "/earnings/payouts", label: t("earnings.nav.payouts"), show: can("payouts") },
    { href: "/earnings/methods", label: t("earnings.nav.methods"), show: can("payouts") },
  ].filter((i) => i.show)
  if (items.length < 2) return null
  return (
    <nav aria-label={t("earnings.title")} className="mb-5 flex gap-1 overflow-x-auto rounded-2xl bg-neutral-surface p-1 [scrollbar-width:none]">
      {items.map((it) => {
        const active = pathname === it.href
        return (
          <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined} className={cn("flex h-11 shrink-0 items-center rounded-xl px-4 text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50", active ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink")}>
            {it.label}
          </Link>
        )
      })}
    </nav>
  )
}
