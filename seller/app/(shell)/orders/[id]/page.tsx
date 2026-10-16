"use client"
import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { format, formatDistanceToNow } from "date-fns"
import { ArrowLeft, Mail, MapPin, MessageSquare, Phone, SearchX } from "lucide-react"
import { Amount, Banner, Button, Card, CardBody, CardHeader, EmptyState, PageHeader, Skeleton, StatusBadge } from "@ciuna/ui-web"
import { SellerNoAccess } from "@/components/no-access"
import { api } from "@/lib/api"
import { useQuery } from "@/lib/query"
import { useSeller } from "@/lib/session"
import { useErrorText, useT } from "@/lib/i18n"
import { OrderActions } from "@/components/orders/order-actions"
import { DueChip } from "@/components/orders/due-chip"
import { FulfilmentChip } from "@/components/orders/fulfilment-chip"
import { dateLocale, orderTotal, STATUS_LABEL_KEY, type SellerOrder, type SellerOrderEvent } from "@/components/orders/format"

interface DetailResponse { order: SellerOrder; events: SellerOrderEvent[] }

export default function OrderDetailPage() {
  const { t } = useT()
  const { can } = useSeller()
  if (!can("orders")) return <SellerNoAccess titleKey="orders.noAccess.title" bodyKey="orders.noAccess.body" />
  return <OrderDetail />
}

function OrderDetail() {
  const { t, locale } = useT()
  const errText = useErrorText()
  const params = useParams<{ id: string }>()
  const id = decodeURIComponent(String(params.id))
  const { data, error, loading, reload, setData } = useQuery<DetailResponse>(`orders:detail:${id}`, () => api<DetailResponse>(`/api/merchant/orders/${encodeURIComponent(id)}`), { refreshMs: 30_000 })
  const dl = dateLocale(locale)

  const back = (
    <Link href="/orders" className="inline-flex min-h-12 items-center gap-1.5 rounded-lg text-sm font-semibold text-primary-text outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
      <ArrowLeft className="size-4" aria-hidden />
      {t("orders.back")}
    </Link>
  )

  if (loading && !data) {
    return (
      <>
        {back}
        <div className="space-y-4" aria-busy="true"><Skeleton className="h-10 w-56" /><Skeleton className="h-48" /><Skeleton className="h-32" /></div>
      </>
    )
  }
  if (!data) {
    const notFound = error?.code === "ORDER_NOT_FOUND"
    return (
      <>
        {back}
        {notFound ? (
          <EmptyState icon={<SearchX />} title={errText("ORDER_NOT_FOUND")} />
        ) : (
          <Banner tone="destructive" title={errText(error?.code)} action={<Button size="sm" variant="secondary" onClick={() => void reload()}>{t("action.retry")}</Button>} />
        )}
      </>
    )
  }

  const { order, events } = data
  const cur = order.totals?.currency
  const tz = order.slot?.timezone
  const fmtSlot = (iso: string) => {
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: tz || undefined }).format(new Date(iso))
    } catch {
      return format(new Date(iso), "PPp", { locale: dl })
    }
  }
  const live = order.status === "new" || order.status === "accepted" || order.status === "preparing"
  const mode = order.fulfillmentMode
  const pickup = mode === "pickup"
  const hasActions = order.actions.length > 0

  return (
    <div className={hasActions ? "pb-24 md:pb-0" : undefined}>
      <PageHeader
        back={back}
        title={t("orders.number", { id: order.publicId })}
        description={formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: dl })}
        action={<StatusBadge status={order.status} label={t(STATUS_LABEL_KEY[order.status])} />}
      />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <FulfilmentChip mode={mode} />
        {live ? <DueChip size="md" dueAt={order.dueAt} /> : null}
      </div>
      {error ? <div className="mb-4"><Banner tone="warning" title={errText(error.code)} action={<Button size="sm" variant="secondary" onClick={() => void reload()}>{t("action.retry")}</Button>} /></div> : null}
      {order.exception ? <div className="mb-4"><Banner tone="warning" title={t("orders.exception.title")}>{t("errors.CONTACT_SUPPORT")}</Banner></div> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="space-y-4">
          <Card>
            <CardHeader title={t("orders.items")} />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[15px]">
                <caption className="sr-only">{t("orders.items")}</caption>
                <thead>
                  <tr className="border-b border-hairline text-sm text-muted">
                    <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">{t("orders.col.item")}</th>
                    <th scope="col" className="px-2 py-2.5 text-right font-semibold">{t("orders.col.qty")}</th>
                    <th scope="col" className="px-2 py-2.5 text-right font-semibold">{t("orders.col.unit")}</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold sm:px-5">{t("orders.col.total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it) => (
                    <tr key={it.id} className="border-b border-hairline last:border-0">
                      <th scope="row" className="px-4 py-3 font-medium text-ink sm:px-5">{it.title}</th>
                      <td className="px-2 py-3 text-right tabular-nums">{it.quantity}</td>
                      <td className="px-2 py-3 text-right"><Amount value={it.unitPrice} currency={cur} breakdown /></td>
                      <td className="px-4 py-3 text-right sm:px-5"><Amount value={it.unitPrice * it.quantity} currency={cur} breakdown /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {order.totals ? (
              <CardBody className="space-y-1.5 border-t border-hairline">
                <div className="flex justify-between text-sm text-muted"><span>{t("orders.subtotal")}</span><Amount value={order.totals.subtotal} currency={cur} breakdown /></div>
                {order.totals.deliveryFee ? <div className="flex justify-between text-sm text-muted"><span>{t("orders.deliveryFee")}</span><Amount value={order.totals.deliveryFee} currency={cur} breakdown /></div> : null}
                <div className="flex items-baseline justify-between pt-1 font-semibold"><span>{t("orders.total")}</span><Amount value={orderTotal(order)} currency={cur} size="large" breakdown /></div>
              </CardBody>
            ) : null}
          </Card>

          {order.note ? (
            <Card>
              <CardHeader title={t("orders.note")} />
              <CardBody><p className="whitespace-pre-wrap text-[15px]">{order.note}</p></CardBody>
            </Card>
          ) : null}

          {order.slot ? (
            <Card>
              <CardHeader title={t("orders.slot")} />
              <CardBody className="space-y-1 text-[15px]">
                <p className="font-medium">{fmtSlot(order.slot.start)}{order.slot.end ? ` – ${new Intl.DateTimeFormat(locale, { timeStyle: "short", timeZone: tz || undefined }).format(new Date(order.slot.end))}` : ""}</p>
                {tz ? <p className="text-sm text-muted">{t("orders.slot.timezone", { tz })}</p> : null}
              </CardBody>
            </Card>
          ) : null}

          {order.digitalContent ? (
            <Card>
              <CardHeader title={t("orders.digital")} description={t("orders.digital.hint")} />
              <CardBody><pre className="whitespace-pre-wrap break-words font-sans text-[15px]">{order.digitalContent}</pre></CardBody>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title={t("orders.customer")} />
            <CardBody className="space-y-2 text-[15px]">
              <p className="font-semibold">{order.customer.name ?? t("orders.customer.unknown")}</p>
              {order.customer.phone ? (
                <a href={`tel:${order.customer.phone.replace(/[^\d+]/g, "")}`} className="flex min-h-12 items-center gap-2 rounded-lg text-primary-text underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"><Phone className="size-4" aria-hidden />{order.customer.phone}</a>
              ) : null}
              {order.customer.email ? (
                <a href={`mailto:${order.customer.email}`} className="flex min-h-12 items-center gap-2 break-all rounded-lg text-primary-text underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"><Mail className="size-4 shrink-0" aria-hidden />{order.customer.email}</a>
              ) : null}
              <Link href={`/messages/${order.id}`} className="flex min-h-12 items-center gap-2 rounded-lg font-semibold text-primary-text outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"><MessageSquare className="size-4" aria-hidden />{t("orders.messageCustomer")}</Link>
            </CardBody>
          </Card>

          {pickup || mode === "delivery" || mode === "in_person_appointment" ? (
            <Card>
              <CardHeader title={t(pickup ? "orders.pickup" : mode === "delivery" ? "orders.deliveryTo" : "orders.location")} />
              <CardBody className="space-y-1.5 text-[15px]">
                <p className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden /><span>{(pickup || mode === "in_person_appointment" ? order.delivery.pickupLocation ?? order.delivery.address : order.delivery.address) ?? t("orders.noAddress")}</span></p>
                {pickup && order.delivery.pickupHours ? <p className="text-sm text-muted">{t("orders.pickup.hours", { hours: order.delivery.pickupHours })}</p> : null}
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader title={t("orders.timeline")} />
            <CardBody>
              {events.length === 0 ? <p className="text-sm text-muted">{t("orders.timeline.empty")}</p> : (
                <ol className="space-y-3">
                  {events.map((e) => (
                    <li key={e.id} className="flex gap-3">
                      <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0">
                        <p className="text-[15px]">{e.message || e.kind.replace(/_/g, " ")}</p>
                        <p className="text-sm text-muted"><time dateTime={e.created_at}>{format(new Date(e.created_at), "PPp", { locale: dl })}</time></p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardBody>
          </Card>

          <OrderActions order={order} onDone={(o) => { setData({ order: o, events }); void reload() }} />
        </div>
      </div>
    </div>
  )
}
