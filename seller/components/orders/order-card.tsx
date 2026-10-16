"use client"
import * as React from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Button, Card, Amount, StatusBadge } from "@ciuna/ui-web"
import { useT } from "@/lib/i18n"
import { DueChip } from "./due-chip"
import { FulfilmentChip } from "./fulfilment-chip"
import { dateLocale, itemsSummary, orderTotal, primaryCardAction, STATUS_LABEL_KEY, type SellerOrder } from "./format"
import { useOrderAction } from "./use-order-action"

export function OrderCard({ order, onChanged }: { order: SellerOrder; onChanged: () => void }) {
  const { t, locale } = useT()
  const { run, busy } = useOrderAction()
  const primary = primaryCardAction(order)
  const ago = formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: dateLocale(locale) })
  const live = order.status === "new" || order.status === "accepted" || order.status === "preparing"

  async function go() {
    if (!primary) return
    const r = await run(order.id, primary)
    if (r.ok) onChanged()
  }

  return (
    <Card className="relative flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/orders/${encodeURIComponent(order.id)}`} className="rounded-md text-base font-semibold text-ink outline-none after:absolute after:inset-0 focus-visible:ring-[3px] focus-visible:ring-ring/50">
            {t("orders.number", { id: order.publicId })}
          </Link>
          <p className="text-sm text-muted">{ago}</p>
        </div>
        <StatusBadge status={order.status} label={t(STATUS_LABEL_KEY[order.status])} />
      </div>
      <p className="text-[15px] text-ink">{itemsSummary(order.items, t)}</p>
      <div className="flex flex-wrap items-center gap-2">
        <FulfilmentChip mode={order.fulfillmentMode} />
        {live ? <DueChip dueAt={order.dueAt} /> : null}
      </div>
      <div className="flex items-center justify-between gap-3">
        <Amount value={orderTotal(order)} currency={order.totals?.currency} size="large" />
        {primary ? (
          <Button size="lg" className="relative z-10 min-h-12" busy={busy === `${order.id}:${primary}`} onClick={go}>
            {t(primary === "accept" ? "orders.action.accept" : "orders.action.start")}
          </Button>
        ) : (
          <span className="text-sm font-semibold text-primary-text">{t("orders.view")}</span>
        )}
      </div>
    </Card>
  )
}
