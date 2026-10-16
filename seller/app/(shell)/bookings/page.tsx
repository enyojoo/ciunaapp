"use client"
import * as React from "react"
import Link from "next/link"
import { CalendarCheck } from "lucide-react"
import { Amount, Banner, Button, Card, EmptyState, PageHeader, Skeleton, StatusBadge, Tabs, useToast } from "@ciuna/ui-web"
import { api } from "@/lib/api"
import { invalidate, useQuery } from "@/lib/query"
import { useT } from "@/lib/i18n"
import { BookingTime } from "@/components/expert/booking-time"
import { Chip, ExpertOnly, bookingStatusLabel, useExpertError, type Booking } from "@/components/expert/shared"
import { browserTimeZone, formatInZone, sessionEnded } from "@/components/expert/logic"

type Scope = "requests" | "upcoming" | "past"
const POLL_MS = 30_000

export default function BookingsPage() {
  return <ExpertOnly><Bookings /></ExpertOnly>
}

function Bookings() {
  const { t } = useT()
  const errText = useExpertError()
  const toast = useToast()
  const [tab, setTab] = React.useState<Scope>("requests")
  const fetchScope = (s: Scope) => () => api<{ bookings: Booking[]; total: number }>(`/api/merchant/expert/bookings?scope=${s}`)
  const requests = useQuery(`expert/bookings/requests`, fetchScope("requests"), { refreshMs: POLL_MS })
  const other = useQuery(tab === "requests" ? null : `expert/bookings/${tab}`, fetchScope(tab), { refreshMs: POLL_MS })
  const active = tab === "requests" ? requests : other
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)
  const [now, setNow] = React.useState(() => new Date())
  React.useEffect(() => { const id = setInterval(() => setNow(new Date()), POLL_MS); return () => clearInterval(id) }, [])

  async function accept(b: Booking) {
    setBusyId(b.id)
    setMessage(null)
    try {
      await api(`/api/merchant/orders/${b.id}/actions`, { method: "POST", json: { action: "accept" } })
      invalidate("expert/")
      invalidate("orders")
      toast.show(t("expert.bookings.accepted"))
      await Promise.all([requests.reload(), tab === "requests" ? Promise.resolve() : other.reload()])
    } catch (e) {
      setMessage(errText(e))
      await requests.reload()
    } finally {
      setBusyId(null)
    }
  }

  const items = active.data?.bookings ?? []
  const count = requests.data?.total ?? requests.data?.bookings.length ?? 0

  return (
    <div>
      <PageHeader title={t("expert.bookings.title")} description={t("expert.bookings.subtitle")} />
      <Tabs<Scope> className="mb-4" value={tab} onChange={setTab} items={[
        { value: "requests", label: t("expert.bookings.tab.requests"), count },
        { value: "upcoming", label: t("expert.bookings.tab.upcoming") },
        { value: "past", label: t("expert.bookings.tab.past") },
      ]} />
      <div className="space-y-3">
        {message ? <Banner tone="destructive" title={message} /> : null}
        {active.loading ? <><Skeleton className="h-32" /><Skeleton className="h-32" /></>
          : active.error && !active.data ? <Banner tone="destructive" title={errText(active.error)} action={<Button size="sm" variant="secondary" onClick={() => void active.reload()}>{t("action.retry")}</Button>} />
          : items.length === 0 ? <Card><EmptyState icon={<CalendarCheck />} title={t(`expert.bookings.empty.${tab}.title`)} description={t(`expert.bookings.empty.${tab}.body`)} /></Card>
          : items.map((b) => {
            const canAccept = b.actions.includes("accept")
            const canComplete = b.actions.includes("fulfill") && sessionEnded(b.slot?.end, now)
            return (
              <Card key={b.id} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/bookings/${b.id}`} className="min-w-0 flex-1 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
                    <h2 className="truncate text-base font-semibold">{b.serviceTitle ?? t("expert.bookings.session")}</h2>
                    <p className="mt-0.5 text-sm text-muted">{b.customerName ?? t("expert.bookings.customer")} {"·"} #{b.publicId}</p>
                  </Link>
                  <StatusBadge status={b.status} label={bookingStatusLabel(t, b)} />
                </div>
                <div className="mt-3"><BookingTime slot={b.slot} compact /></div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {b.totals ? <Amount value={b.totals.subtotal} currency={b.totals.currency} className="font-semibold" /> : null}
                    {b.overdue ? <Chip tone="warning">{t("expert.bookings.overdue")}</Chip> : b.status === "new" && b.dueAt ? <span className="text-sm text-muted">{t("expert.bookings.respond_by", { time: formatInZone(b.dueAt, b.slot?.timezone || browserTimeZone()) })}</span> : null}
                    {b.exception ? <Chip tone="warning">{t("expert.bookings.exception")}</Chip> : null}
                  </div>
                  {canAccept ? <Button onClick={() => accept(b)} busy={busyId === b.id}>{t("expert.bookings.accept")}</Button>
                    : canComplete ? <Button asChild><Link href={`/bookings/${b.id}`}>{t("expert.bookings.complete")}</Link></Button>
                    : <Button asChild variant="secondary"><Link href={`/bookings/${b.id}`}>{t("expert.bookings.view")}</Link></Button>}
                </div>
              </Card>
            )
          })}
      </div>
    </div>
  )
}
