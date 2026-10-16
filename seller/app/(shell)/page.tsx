"use client"
import * as React from "react"
import Link from "next/link"
import { ClipboardList, CalendarCheck, ArrowRight, CheckCircle2, Circle } from "lucide-react"
import { Card, CardBody, PageHeader, Button, Skeleton } from "@ciuna/ui-web"
import { useSeller } from "@/lib/session"
import { useT } from "@/lib/i18n"
import { api } from "@/lib/api"
import { useQuery } from "@/lib/query"

type Checklist = { status: string; checklist: Array<{ key: string; done: boolean }>; ready: boolean }

export default function HomePage() {
  const { merchant, can } = useSeller()
  const { t } = useT()
  const isExpert = merchant?.type === "expert"
  const setup = merchant && ["draft", "rejected"].includes(merchant.status)
  const checklist = useQuery<Checklist>(setup ? "application" : null, () => api("/api/merchant/application"))
  const orders = useQuery<{ counts: { new: number; active: number } }>(merchant && !setup && can("orders") ? "home:orders" : null, () => api("/api/merchant/orders?status=new&limit=1"), { refreshMs: 30000 })
  if (!merchant) return null
  const name = merchant.display_name

  return (
    <>
      <PageHeader title={t("home.welcome", { name })} description={t(setup ? "home.setup.body" : "home.live.body")} />

      {setup ? (
        <Card>
          <CardBody>
            <h2 className="text-base font-semibold">{t("home.setup.title")}</h2>
            <ul className="mt-3 space-y-2">
              {checklist.loading && !checklist.data ? <Skeleton className="h-24" /> : null}
              {checklist.data?.checklist.map((i) => (
                <li key={i.key} className="flex items-center gap-3 text-[15px]">
                  {i.done ? <CheckCircle2 className="size-5 text-success" aria-label={t("setup.done")} /> : <Circle className="size-5 text-subtle" aria-label={t("setup.todo")} />}
                  <span className={i.done ? "text-muted" : "font-medium"}>{t(`setup.item.${i.key}`)}</span>
                </li>
              ))}
            </ul>
            <Link href="/setup" className="mt-4 inline-block"><Button>{t("banner.draft.action")} <ArrowRight /></Button></Link>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href={isExpert ? "/bookings" : "/orders"}>
            <Card className="p-5 transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                {isExpert ? <CalendarCheck className="size-6 text-primary-text" aria-hidden /> : <ClipboardList className="size-6 text-primary-text" aria-hidden />}
                <ArrowRight className="size-4 text-muted" aria-hidden />
              </div>
              <p className="mt-4 text-3xl font-bold tabular-nums">{orders.data?.counts.new ?? "–"}</p>
              <p className="text-sm font-semibold">{t(isExpert ? "home.newBookings" : "home.newOrders")}</p>
              <p className="mt-0.5 text-sm text-muted">{t("home.needsAction")}</p>
            </Card>
          </Link>
          <Card className="p-5">
            <p className="text-sm font-semibold text-muted">{t("home.inProgress")}</p>
            <p className="mt-3 text-3xl font-bold tabular-nums">{orders.data?.counts.active ?? "–"}</p>
          </Card>
        </div>
      )}
    </>
  )
}
