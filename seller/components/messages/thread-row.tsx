"use client"
import * as React from "react"
import Link from "next/link"
import { formatDistanceToNowStrict } from "date-fns"
import { Card, StatusBadge, cn } from "@ciuna/ui-web"
import { useT } from "@/lib/i18n"
import { dateLocale, STATUS_LABEL_KEY } from "@/components/orders/format"
import type { Thread } from "./format"

export function ThreadRow({ thread }: { thread: Thread }) {
  const { t, locale } = useT()
  const ago = formatDistanceToNowStrict(new Date(thread.lastAt), { addSuffix: true, locale: dateLocale(locale) })
  const name = thread.customerName ?? t("messages.customer")
  const mine = thread.lastFrom === "merchant"
  return (
    <Card className={cn("relative flex flex-col gap-2 p-4", thread.unread ? "border-primary" : undefined)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/messages/${encodeURIComponent(thread.orderId)}`} className="rounded-md text-base font-semibold text-ink outline-none after:absolute after:inset-0 focus-visible:ring-[3px] focus-visible:ring-ring/50">
            {name}
          </Link>
          <p className="text-sm text-muted">{t("orders.number", { id: thread.publicId })} · <time dateTime={thread.lastAt}>{ago}</time></p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {thread.unread ? (
            <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground" aria-label={t("messages.unread", { count: thread.unread })}>{thread.unread}</span>
          ) : null}
        </div>
      </div>
      <p className={cn("line-clamp-2 break-words text-[15px]", thread.unread ? "font-semibold text-ink" : "text-muted")}>
        {mine ? <span className="font-normal text-muted">{t("messages.you")}: </span> : null}{thread.lastMessage}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={thread.status} label={t(STATUS_LABEL_KEY[thread.status])} />
        {thread.closed ? <span className="text-sm text-muted">{t("messages.closed.chip")}</span> : null}
      </div>
    </Card>
  )
}
