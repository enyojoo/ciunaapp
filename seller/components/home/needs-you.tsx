"use client"
import * as React from "react"
import Link from "next/link"
import { Timer, MessageSquare, PackageMinus, FileWarning, ChevronRight, CheckCircle2 } from "lucide-react"
import { Card, CardHeader, Skeleton, cn } from "@ciuna/ui-web"
import { useT } from "@/lib/i18n"
import { useSeller } from "@/lib/session"
import { minutesUntil, splitDuration } from "@/components/orders/format"
import { useDate } from "@/components/earnings/format"
import type { useHomeData } from "./home-data"

interface Item { key: string; href: string; icon: React.ElementType; title: string; sub: string; urgent?: boolean }

/** To-do list ordered by urgency: accept first. Each row is a real link; rows appear only when their data exists. */
export function NeedsYou({ data, isExpert, loading }: { data: ReturnType<typeof useHomeData>; isExpert: boolean; loading: boolean }) {
  const { t } = useT()
  const { can } = useSeller()
  const date = useDate()
  const items: Item[] = []

  const newOrders = data.orders.data
  if (can("orders") && newOrders && newOrders.counts.new > 0) {
    const due = newOrders.orders.map((o) => o.dueAt).filter(Boolean).sort()[0]
    let sub = t("home.needs.acceptSub.none")
    if (due) {
      const mins = minutesUntil(due)
      const { hours, minutes } = splitDuration(mins)
      const span = hours > 0 ? t("orders.duration.hm", { h: hours, m: minutes }) : t("orders.duration.m", { m: minutes })
      sub = t(mins < 0 ? "home.needs.acceptSub.overdue" : "home.needs.acceptSub.due", { time: span })
    }
    const c = newOrders.counts.new
    items.push({ key: "accept", href: isExpert ? "/bookings" : "/orders", icon: Timer, urgent: newOrders.orders.some((o) => o.overdue), title: t(isExpert ? (c === 1 ? "home.needs.acceptBooking.one" : "home.needs.acceptBooking.other") : c === 1 ? "home.needs.accept.one" : "home.needs.accept.other", { count: c }), sub })
  }
  if (can("messages")) {
    const th = data.messages.data?.threads.find((x) => x.unread > 0)
    if (th) items.push({ key: "reply", href: `/messages/${encodeURIComponent(th.orderId)}`, icon: MessageSquare, title: t("home.needs.reply", { name: th.customerName ?? t("messages.customer") }), sub: t("home.needs.replySub", { id: th.publicId }) })
  }
  for (const p of data.aggregate?.lowStock ?? []) items.push({ key: `stock-${p.id}`, href: `/catalog/${encodeURIComponent(p.id)}`, icon: PackageMinus, title: t("home.needs.lowStock", { title: p.title, count: p.stock }), sub: t("home.needs.lowStockSub") })
  for (const d of data.aggregate?.documentsExpiring ?? []) items.push({ key: `doc-${d.kind}`, href: "/setup", icon: FileWarning, title: t("home.needs.doc", { label: d.kind.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()), date: date(d.expiresAt) }), sub: t("home.needs.docSub") })

  if (loading) return <Skeleton className="h-44" />
  const waiting = !data.orders.data && !data.messages.data
  if (waiting) return null
  return (
    <Card className="overflow-hidden">
      <CardHeader title={t("home.needs.title")} action={items.length ? <span className="rounded-full bg-warning-surface px-2.5 py-1 text-xs font-semibold text-warning-text">{t(items.length === 1 ? "home.needs.count.one" : "home.needs.count.other", { count: items.length })}</span> : undefined} />
      {items.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-5 sm:px-5">
          <CheckCircle2 className="size-5 text-success-text" aria-hidden />
          <div><p className="text-[15px] font-semibold">{t("home.needs.empty.title")}</p><p className="text-sm text-muted">{t("home.needs.empty.body")}</p></div>
        </div>
      ) : (
        <ul className="divide-y divide-hairline">
          {items.map((i) => (
            <li key={i.key}>
              <Link href={i.href} className="flex min-h-16 items-center gap-3 px-4 py-3 outline-none hover:bg-neutral-surface focus-visible:bg-neutral-surface sm:px-5">
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", i.urgent ? "bg-destructive-surface text-destructive-text" : "bg-warning-surface text-warning-text")}><i.icon className="size-5" aria-hidden /></span>
                <span className="min-w-0 flex-1"><span className="block line-clamp-2 text-[15px] font-semibold text-ink">{i.title}</span><span className="block line-clamp-2 text-sm text-muted">{i.sub}</span></span>
                <ChevronRight className="size-4 shrink-0 text-subtle" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
