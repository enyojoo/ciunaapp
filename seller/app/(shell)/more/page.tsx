"use client"
import * as React from "react"
import Link from "next/link"
import { UserRound, ShieldCheck, Users, Globe, LogOut, ChevronRight, Wallet, Package, Clock, Bell, Star, Landmark } from "lucide-react"
import { Amount, Card, Chip, PageHeader, LANGUAGE_LABELS, cn, type ChipTone } from "@ciuna/ui-web"
import { api } from "@/lib/api"
import { useQuery } from "@/lib/query"
import { useSeller } from "@/lib/session"
import { useT, LOCALE_LIST } from "@/lib/i18n"
import type { Balance, PayoutMethod } from "@/components/earnings/logic"
import type { ReviewsResponse } from "@/components/reviews/logic"

interface Row { href: string; icon: React.ElementType; label: string; hint?: React.ReactNode; badge?: { text: string; tone: ChipTone }; show: boolean; /** Already in the sidebar from 768px, so it leaves More there. */ inSidebar?: boolean }

export default function MorePage() {
  const { merchant, can, signOut, me } = useSeller()
  const { t, locale, setLocale } = useT()
  const operating = !!merchant && ["live", "paused"].includes(merchant.status)
  // Hints reuse the same cached queries as the pages they lead to. A hint with no data is simply not drawn.
  const reviews = useQuery<ReviewsResponse>(operating && can("orders") ? "more:reviews" : null, () => api("/api/merchant/reviews?status=all&limit=1"))
  const earnings = useQuery<{ balances: Balance[] }>(operating && can("earnings") ? "earnings" : null, () => api("/api/merchant/earnings"))
  const methods = useQuery<{ methods: PayoutMethod[] }>(operating && can("payouts") ? "payout-methods" : null, () => api("/api/merchant/payout-methods"))
  const team = useQuery<{ members: unknown[] }>(can("team") ? "more:team" : null, () => api("/api/merchant/team"))
  if (!merchant) return null

  const top = earnings.data?.balances.slice().sort((a, b) => b.available - a.available)[0]
  const avg = reviews.data?.summary.avg
  const dflt = methods.data?.methods.find((m) => m.is_default) ?? methods.data?.methods[0]
  const verification = ({ draft: { text: t("more.verification.action"), tone: "warning" }, in_review: { text: t("more.verification.review"), tone: "warning" }, rejected: { text: t("more.verification.rejected"), tone: "destructive" } } as Record<string, { text: string; tone: ChipTone }>)[merchant.status] ?? { text: t("more.verification.verified"), tone: "success" as ChipTone }

  const business: Row[] = [
    { href: "/profile", icon: UserRound, label: t(merchant.type === "store" ? "more.storeProfile" : "more.expertProfile"), show: can("profile") },
    { href: "/reviews", icon: Star, label: t("reviews.nav"), show: can("orders"), inSidebar: true, hint: typeof avg === "number" ? `${avg.toFixed(1)} ★` : undefined },
    { href: "/setup", icon: ShieldCheck, label: t("more.verification"), show: can("documents"), badge: verification },
    ...(merchant.type === "store"
      ? [{ href: "/catalog/fulfillment", icon: Package, label: t("more.fulfillment"), show: can("catalog") } as Row]
      : [{ href: "/availability", icon: Clock, label: t("nav.availability"), show: can("availability") } as Row]),
    { href: "/earnings", icon: Wallet, label: t("nav.earnings"), show: can("earnings"), inSidebar: true, hint: top ? <Amount value={top.available} currency={top.currency} /> : undefined },
    { href: "/earnings/methods", icon: Landmark, label: t("more.payoutMethods"), show: can("payouts"), hint: dflt ? `${dflt.label}${dflt.last4 ? ` ••${dflt.last4}` : ""}` : undefined },
  ]
  const settings: Row[] = [
    { href: "/settings/notifications", icon: Bell, label: t("more.alerts"), show: true },
    { href: "/settings/team", icon: Users, label: t("more.team"), show: can("team"), hint: team.data ? t(team.data.members.length === 1 ? "more.team.count.one" : "more.team.count", { count: team.data.members.length }) : undefined },
  ]

  const group = (title: string, rows: Row[]) => {
    const shown = rows.filter((r) => r.show)
    if (!shown.length) return null
    return (
      <section aria-label={title} className="space-y-2">
        <h2 className="px-1 text-sm font-semibold text-muted">{title}</h2>
        <Card className="divide-y divide-hairline overflow-hidden">
          {shown.map((r) => (
            <Link key={r.href} href={r.href} className={cn("flex min-h-[50px] items-center gap-3 px-4 py-3 hover:bg-neutral-surface", r.inSidebar && "md:hidden")}>
              <r.icon className="size-5 shrink-0 text-muted" aria-hidden />
              <span className="min-w-0 flex-1 font-semibold">{r.label}</span>
              {r.hint ? <span className="max-w-[40%] truncate text-sm text-muted">{r.hint}</span> : null}
              {r.badge ? <Chip tone={r.badge.tone}>{r.badge.text}</Chip> : null}
              <ChevronRight className="size-4 shrink-0 text-subtle" aria-hidden />
            </Link>
          ))}
        </Card>
      </section>
    )
  }

  return (
    <div className="mx-auto w-full md:max-w-[520px]">
      <PageHeader title={t("nav.more")} description={me?.user.email} />
      <div className="space-y-5">
        {group(t("more.group.business"), business)}
        {group(t("more.group.settings"), settings)}
        <Card className="divide-y divide-hairline overflow-hidden">
          <label className="flex min-h-[50px] items-center gap-3 px-4 py-3">
            <Globe className="size-5 text-muted" aria-hidden />
            <span className="flex-1 font-semibold">{t("language.label")}</span>
            <select value={locale} onChange={(e) => setLocale(e.target.value as any)} className="h-10 rounded-xl border border-input-edge bg-white px-3 text-sm">
              {LOCALE_LIST.map((l) => <option key={l} value={l}>{LANGUAGE_LABELS[l]}</option>)}
            </select>
          </label>
          <button type="button" onClick={signOut} className="flex min-h-[50px] w-full items-center gap-3 px-4 py-3 text-left hover:bg-neutral-surface">
            <LogOut className="size-5 text-muted" aria-hidden />
            <span className="font-semibold">{t("action.signOut")}</span>
          </button>
        </Card>
      </div>
    </div>
  )
}
