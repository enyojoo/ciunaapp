"use client"
import * as React from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Button, Card, Amount, StatusBadge, cn } from "@ciuna/ui-web"
import { useT } from "@/lib/i18n"
import { BookingTime } from "@/components/expert/booking-time"
import { DueChip } from "./due-chip"
import { FulfilmentChip } from "./fulfilment-chip"
import { dateLocale, fulfilmentKind, itemsSummary, orderTotal, primaryCardAction, STATUS_LABEL_KEY, type SellerOrder } from "./format"
import { useOrderAction } from "./use-order-action"

/** `compact` is the desktop board card: 12px padding and a small button. */
export function OrderCard({ order, onChanged, compact }: { order: SellerOrder; onChanged: () => void; compact?: boolean }) {
  const { t, locale } = useT()
  const { run, busy } = useOrderAction()
  const primary = primaryCardAction(order)
  const ago = formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: dateLocale(locale) })
  const live = order.status === "new" || order.status === "accepted" || order.status === "preparing"
  const booking = fulfilmentKind(order.fulfillmentMode) === "booking"
  const rejected = order.status === "cancelled" && !!order.rejectReason
  const customer = order.customer?.name

  async function go() {
    if (!primary) return
    const r = await run(order.id, primary)
    if (r.ok) onChanged()
  }
  const actionKey = primary === "accept" ? (booking ? "orders.action.acceptBooking" : "orders.action.accept") : "orders.action.start"

  return (
    <Card className={cn("relative flex flex-col gap-3", compact ? "p-3" : "p-4", !live && "bg-neutral-surface/60")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/orders/${encodeURIComponent(order.id)}`} className="whitespace-nowrap rounded-md text-base font-semibold text-ink outline-none after:absolute after:inset-0 focus-visible:ring-[3px] focus-visible:ring-ring/50">
            {t("orders.number", { id: order.publicId })}
          </Link>
          <p className="truncate text-sm text-muted">{customer ? `${customer} · ` : ""}{ago}</p>
        </div>
        <StatusBadge status={order.status} label={t(STATUS_LABEL_KEY[order.status])} />
      </div>
      {booking && order.slot ? (
        <div className="space-y-0.5">
          {order.items[0]?.title ? <p className="text-[15px] text-ink">{order.items[0].title}</p> : null}
          <BookingTime slot={{ start: order.slot.start, end: order.slot.end ?? order.slot.start, timezone: order.slot.timezone ?? null }} compact />
        </div>
      ) : (
        <p className="text-[15px] text-ink">{itemsSummary(order.items, t)}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <FulfilmentChip mode={order.fulfillmentMode} />
        {live ? <DueChip dueAt={order.dueAt} /> : null}
      </div>
      {rejected ? <p className="text-sm text-muted"><span className="font-semibold text-ink">{t("orders.rejectedReason")}</span> {order.rejectReason}</p> : null}
      <div className="flex items-center justify-between gap-3">
        <Amount value={orderTotal(order)} currency={order.totals?.currency} size="large" />
        {primary ? (
          <Button size={compact ? "sm" : "lg"} className={cn("relative z-10", !compact && "min-h-12")} busy={busy === `${order.id}:${primary}`} onClick={go}>
            {t(actionKey)}
          </Button>
        ) : live ? (
          <span className="text-sm font-semibold text-primary-text">{t("orders.view")}</span>
        ) : null}
      </div>
    </Card>
  )
}
