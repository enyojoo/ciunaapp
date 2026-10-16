"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BrandLogo } from "@ciuna/shared"
import { cn, Banner, Button, Skeleton } from "@ciuna/ui-web"
import { Menu } from "lucide-react"
import { useSeller } from "@/lib/session"
import { useT } from "@/lib/i18n"
import { api } from "@/lib/api"
import { navFor, MORE_ITEM } from "./nav"
import { MerchantSwitcher } from "./merchant-switcher"

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, session, me, merchant, can, refresh } = useSeller()
  const { t } = useT()
  const pathname = usePathname()
  const router = useRouter()

  React.useEffect(() => {
    if (!ready) return
    if (!session) router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    else if (me && me.merchants.length === 0) router.replace("/onboarding")
  }, [ready, session, me, pathname, router])

  if (!ready || !session || !me || !merchant)
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6" aria-busy="true" aria-label={t("state.loading")}>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    )

  const items = navFor(merchant.type).filter((i) => i.ready && (!i.permission || can(i.permission)))
  const bottom = items.filter((i) => i.primary).slice(0, 4)

  async function resume() {
    await api("/api/merchant/status", { method: "POST", json: { status: "live" } })
    await refresh()
  }

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[248px_1fr]">
      {/* sidebar, from md */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-hairline bg-white md:flex">
        <div className="px-5 pb-4 pt-6"><BrandLogo size="lg" /></div>
        <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto px-3">
          {[...items, { ...MORE_ITEM, ready: true }].map((i) => {
            const active = isActive(pathname, i.href)
            const Icon = i.icon
            return (
              <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined} className={cn("flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition-colors", active ? "bg-primary-tint text-primary-text" : "text-ink hover:bg-neutral-surface")}>
                <Icon className="size-5" aria-hidden />
                {t(i.labelKey)}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-hairline p-3"><MerchantSwitcher /></div>
      </aside>

      <div className="min-w-0">
        {/* top bar on phones */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-hairline bg-white/90 px-4 pt-safe backdrop-blur md:hidden">
          <MerchantSwitcher compact />
          <Link href="/more" aria-label={t("nav.more")} className="flex size-10 items-center justify-center rounded-full hover:bg-neutral-surface"><Menu className="size-5" /></Link>
        </header>

        <main className="mx-auto w-full max-w-[1100px] px-4 pb-nav pt-5 sm:px-6 md:pb-12 md:pt-8">
          <StatusBanner status={merchant.status} reason={merchant.rejection_reason} onResume={resume} />
          {children}
        </main>

        {/* bottom nav on phones */}
        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 grid border-t border-hairline bg-white pb-[env(safe-area-inset-bottom)] md:hidden" style={{ gridTemplateColumns: `repeat(${bottom.length + 1}, minmax(0, 1fr))` }}>
          {[...bottom, { ...MORE_ITEM, ready: true }].map((i) => {
            const active = isActive(pathname, i.href)
            const Icon = i.icon
            return (
              <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined} className={cn("flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold", active ? "text-primary-text" : "text-muted")}>
                <Icon className="size-6" aria-hidden />
                {t(i.labelKey)}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

function StatusBanner({ status, reason, onResume }: { status: string; reason: string | null; onResume: () => void }) {
  const { t } = useT()
  const [busy, setBusy] = React.useState(false)
  if (status === "live") return null
  const common = "mb-5"
  if (status === "draft")
    return <div className={common}><Banner tone="warning" title={t("banner.draft.title")} action={<Link href="/setup"><Button size="sm">{t("banner.draft.action")}</Button></Link>} /></div>
  if (status === "in_review")
    return <div className={common}><Banner tone="neutral" title={t("banner.review.title")}>{t("banner.review.body")}</Banner></div>
  if (status === "rejected")
    return <div className={common}><Banner tone="destructive" title={t("banner.rejected.title")} action={<Link href="/setup"><Button size="sm" variant="secondary">{t("banner.draft.action")}</Button></Link>}>{reason}</Banner></div>
  if (status === "suspended")
    return <div className={common}><Banner tone="destructive" title={t("banner.suspended.title")}>{reason}</Banner></div>
  return <div className={common}><Banner tone="warning" title={t("banner.paused.title")} action={<Button size="sm" busy={busy} onClick={async () => { setBusy(true); try { await onResume() } finally { setBusy(false) } }}>{t("banner.paused.action")}</Button>} /></div>
}
