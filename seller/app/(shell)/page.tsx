"use client"
import * as React from "react"
import Link from "next/link"
import { ClipboardList, CalendarCheck, Activity, ArrowRight, Check, Circle } from "lucide-react"
import { Amount, Card, CardBody, CardHeader, PageHeader, Button, Skeleton, ProgressBar, Chip, cn } from "@ciuna/ui-web"
import { useSeller } from "@/lib/session"
import { useT } from "@/lib/i18n"
import { api } from "@/lib/api"
import { useQuery } from "@/lib/query"
import { StatTile } from "@/components/home/stat-tile"
import { NeedsYou } from "@/components/home/needs-you"
import { useHomeData } from "@/components/home/home-data"

type Checklist = { status: string; checklist: Array<{ key: string; done: boolean }>; ready: boolean }

export default function HomePage() {
  const { merchant, can } = useSeller()
  const { t } = useT()
  const isExpert = merchant?.type === "expert"
  const setup = !!merchant && ["draft", "rejected", "in_review"].includes(merchant.status)
  const paused = merchant?.status === "paused" || merchant?.status === "suspended"
  const checklist = useQuery<Checklist>(setup ? "application" : null, () => api("/api/merchant/application"))
  const live = !!merchant && !setup
  const home = useHomeData({ enabled: live && !paused, orders: can("orders"), messages: can("messages"), earnings: can("earnings"), currency: merchant?.default_currency ?? "RUB" })
  if (!merchant) return null
  const name = merchant.display_name

  return (
    <>
      <PageHeader title={t("home.welcome", { name })} description={t(setup ? "home.setup.body" : "home.live.body")} />
      {setup ? <SetupCard checklist={checklist.data} loading={checklist.loading && !checklist.data} canContinue={merchant.status !== "in_review"} /> : (
        <LiveHome home={home} isExpert={isExpert} paused={paused} />
      )}
    </>
  )
}

function SetupCard({ checklist, loading, canContinue }: { checklist?: Checklist; loading: boolean; canContinue: boolean }) {
  const { t } = useT()
  const done = checklist?.checklist.filter((i) => i.done).length ?? 0
  const total = checklist?.checklist.length ?? 0
  return (
    <Card>
      <CardBody>
        <h2 className="text-base font-semibold">{t("home.setup.title")}</h2>
        {loading ? <Skeleton className="mt-3 h-40" /> : checklist ? (
          <>
            <ProgressBar className="mt-3" value={done} max={total || 1} label={t("home.setup.progress")} valueText={t("home.setup.count", { done, total })} />
            <ul className="mt-4 divide-y divide-hairline">
              {checklist.checklist.map((i) => (
                <li key={i.key} className="flex items-center gap-3 py-2.5 text-[15px]">
                  {i.done ? <Check className="size-5 shrink-0 rounded-full bg-success-surface p-0.5 text-success-text" aria-hidden /> : <Circle className="size-5 shrink-0 text-subtle" aria-hidden />}
                  <span className={cn("flex-1", i.done ? "text-muted" : "font-medium")}>{t(`setup.item.${i.key}`)}</span>
                  <Chip tone={i.done ? "success" : "neutral"}>{t(i.done ? "setup.done" : "setup.todo")}</Chip>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {canContinue ? <Link href="/setup" className="mt-4 inline-block"><Button>{t("banner.draft.action")} <ArrowRight /></Button></Link> : null}
      </CardBody>
    </Card>
  )
}

function LiveHome({ home, isExpert, paused }: { home: ReturnType<typeof useHomeData>; isExpert: boolean; paused: boolean }) {
  const { t } = useT()
  const { can } = useSeller()
  const showOrders = can("orders")
  const showEarnings = can("earnings")
  const loadingOrders = !paused && showOrders && !home.orders.data && home.orders.loading
  const counts = paused ? { new: 0, active: 0 } : home.orders.data?.counts
  const newCount = counts?.new
  const overdue = !!home.orders.data?.orders.some((o) => o.overdue)
  return (
    <div className="space-y-4">
      {showOrders ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <StatTile
            href={isExpert ? "/bookings" : "/orders"}
            icon={isExpert ? <CalendarCheck aria-hidden /> : <ClipboardList aria-hidden />}
            label={t(isExpert ? "home.newBookings" : "home.newOrders")}
            value={newCount ?? "–"}
            hint={t("home.needsAction")}
            actionable={!!newCount}
            loading={loadingOrders}
            delta={home.aggregate?.delta?.orders ? { direction: home.aggregate.delta.orders.direction, text: t(home.aggregate.delta.orders.direction === "up" ? "home.delta.more" : "home.delta.fewer", { count: home.aggregate.delta.orders.amount }) } : null}
            badge={overdue ? <Chip tone="destructive">{t("home.overdue")}</Chip> : null}
          />
          <StatTile icon={<Activity aria-hidden />} label={t("home.inProgress")} value={counts?.active ?? "–"} hint={t("home.inProgress.help")} loading={loadingOrders} />
        </div>
      ) : null}
      <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-4 lg:space-y-0">
        {paused ? null : <NeedsYou data={home} isExpert={isExpert} loading={loadingOrders} />}
        {showEarnings && !paused ? <TodayEarnings today={home.today} loading={!home.earnings.data && home.earnings.loading} /> : null}
      </div>
    </div>
  )
}

function TodayEarnings({ today, loading }: { today: ReturnType<typeof useHomeData>["today"]; loading: boolean }) {
  const { t } = useT()
  if (loading) return <Skeleton className="h-52" />
  return (
    <Card>
      <CardHeader title={t("home.today.title")} action={today ? <span className="text-sm text-muted">{t(today.orders === 1 ? "home.today.orders.one" : "home.today.orders.other", { count: today.orders })}</span> : undefined} />
      <CardBody>
        {today ? (
          <>
            <p><Amount value={Math.round(today.net)} currency={today.currency} size="display" /></p>
            <dl className="mt-4 divide-y divide-hairline text-[15px]">
              <Row label={t("home.today.gross")} value={<Amount value={today.gross} currency={today.currency} breakdown />} />
              <Row label={t("home.today.fee")} value={<Amount value={-today.fee} currency={today.currency} breakdown signed />} />
              <Row label={t("home.today.net")} strong value={<Amount value={today.net} currency={today.currency} breakdown />} />
            </dl>
          </>
        ) : <p className="text-[15px] text-muted">{t("home.today.empty")}</p>}
        <Link href="/earnings" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-text">{t("home.today.view")} <ArrowRight className="size-4" aria-hidden /></Link>
      </CardBody>
    </Card>
  )
}
function Row({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return <div className={cn("flex items-center justify-between py-2", strong && "font-semibold")}><dt className={strong ? "" : "text-muted"}>{label}</dt><dd>{value}</dd></div>
}
