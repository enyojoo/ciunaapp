"use client"
import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Lock, SearchX } from "lucide-react"
import { Banner, Button, EmptyState, PageHeader, Skeleton, StatusBadge, cn } from "@ciuna/ui-web"
import { api, ApiError } from "@/lib/api"
import { invalidate, useQuery } from "@/lib/query"
import { useSeller } from "@/lib/session"
import { useErrorText, useT } from "@/lib/i18n"
import { Composer } from "@/components/messages/composer"
import { unreadCustomerId, type ChatMessage, type ThreadResponse } from "@/components/messages/format"
import { dateLocale, STATUS_LABEL_KEY } from "@/components/orders/format"

export default function ThreadPage() {
  const { t } = useT()
  const { can } = useSeller()
  if (!can("messages")) return <EmptyState icon={<Lock />} title={t("messages.noAccess.title")} description={t("messages.noAccess.body")} />
  return <Thread />
}

function Thread() {
  const { t, locale } = useT()
  const errText = useErrorText()
  const params = useParams<{ orderId: string }>()
  const orderId = decodeURIComponent(String(params.orderId))
  const { data, error, loading, reload, setData } = useQuery<ThreadResponse>(`messages:thread:${orderId}`, () => api<ThreadResponse>(`/api/merchant/messages/${encodeURIComponent(orderId)}`), { refreshMs: 10_000 })
  const [busy, setBusy] = React.useState(false)
  const [sendError, setSendError] = React.useState<string | null>(null)
  const dl = dateLocale(locale)
  const endRef = React.useRef<HTMLDivElement>(null)

  // Mark the customer's messages read when they are on screen (open, new arrivals, and when the tab regains focus via the poll).
  const latest = data ? unreadCustomerId(data.messages) : null
  const marked = React.useRef<number | null>(null)
  React.useEffect(() => {
    if (latest === null || marked.current === latest || document.visibilityState === "hidden") return
    marked.current = latest
    api(`/api/merchant/messages/${encodeURIComponent(orderId)}/read`, { method: "POST" })
      .then(() => { invalidate("messages:list"); setData((d) => (d ? { ...d, messages: d.messages.map((m) => (m.senderKind === "customer" && !m.readAt ? { ...m, readAt: new Date().toISOString() } : m)) } : d)) })
      .catch(() => { marked.current = null })
  }, [latest, orderId, setData])

  const count = data?.messages.length ?? 0
  React.useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }) }, [count])

  async function send(body: string): Promise<boolean> {
    setBusy(true)
    setSendError(null)
    try {
      const r = await api<{ message: ChatMessage }>(`/api/merchant/messages/${encodeURIComponent(orderId)}`, { method: "POST", json: { body, language: locale } })
      setData((d) => (d ? { ...d, messages: [...d.messages, r.message] } : d))
      invalidate("messages:list")
      return true
    } catch (e) {
      setSendError(errText(e instanceof ApiError ? e.code : undefined))
      if (e instanceof ApiError && e.code === "CHAT_CLOSED") void reload()
      return false
    } finally {
      setBusy(false)
    }
  }

  const back = (
    <Link href="/messages" className="inline-flex min-h-12 items-center gap-1.5 rounded-lg text-sm font-semibold text-primary-text outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
      <ArrowLeft className="size-4" aria-hidden />
      {t("messages.back")}
    </Link>
  )

  if (loading && !data) return <>{back}<div className="space-y-3" aria-busy="true"><Skeleton className="h-10 w-56" /><Skeleton className="h-16 w-3/4" /><Skeleton className="ml-auto h-16 w-2/3" /></div></>
  if (!data) {
    return (
      <>
        {back}
        {error?.code === "ORDER_NOT_FOUND" ? <EmptyState icon={<SearchX />} title={errText("ORDER_NOT_FOUND")} /> : <Banner tone="destructive" title={errText(error?.code)} action={<Button size="sm" variant="secondary" onClick={() => void reload()}>{t("action.retry")}</Button>} />}
      </>
    )
  }

  const { order, messages, closed, available } = data
  let lastDay = ""
  return (
    <div className="pb-[18rem] md:pb-0">
      <PageHeader
        back={back}
        title={order.customerName ?? t("messages.customer")}
        description={t("orders.number", { id: order.publicId })}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={order.status} label={t(STATUS_LABEL_KEY[order.status])} />
            <Link href={`/orders/${encodeURIComponent(order.id)}`} className="inline-flex min-h-12 items-center rounded-lg text-sm font-semibold text-primary-text underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50">{t("messages.viewOrder")}</Link>
          </div>
        }
      />
      {error ? <div className="mb-3"><Banner tone="warning" title={errText(error.code)} action={<Button size="sm" variant="secondary" onClick={() => void reload()}>{t("action.retry")}</Button>} /></div> : null}
      {closed ? <div className="mb-3"><Banner tone="neutral" title={t(available ? "messages.closed.title" : "messages.unavailable.title")}>{t(available ? "messages.closed.body" : "messages.unavailable.body")}</Banner></div> : null}

      <ol className="mb-4 space-y-2" aria-label={t("messages.history")} aria-live="polite">
        {messages.length === 0 ? <li className="py-10 text-center text-sm text-muted">{t("messages.thread.empty")}</li> : null}
        {messages.map((m) => {
          const mine = m.senderKind === "merchant"
          const day = format(new Date(m.createdAt), "PP", { locale: dl })
          const showDay = day !== lastDay
          lastDay = day
          return (
            <React.Fragment key={m.id}>
              {showDay ? <li className="py-2 text-center text-xs font-semibold text-muted" aria-hidden>{day}</li> : null}
              <li className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] rounded-2xl px-3.5 py-2.5 sm:max-w-[70%]", mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-neutral-surface text-ink")}>
                  <p className="sr-only">{t(mine ? "messages.you" : "messages.customer")}</p>
                  <p className="whitespace-pre-wrap break-words text-[15px]">{m.body}</p>
                  <p className={cn("mt-1 text-right text-xs", mine ? "text-ink/70" : "text-muted")}>
                    <time dateTime={m.createdAt}>{format(new Date(m.createdAt), "p", { locale: dl })}</time>
                    {mine && m.readAt ? ` · ${t("messages.seen")}` : ""}
                  </p>
                </div>
              </li>
            </React.Fragment>
          )
        })}
      </ol>
      <div ref={endRef} />
      <Composer busy={busy} disabled={closed} error={sendError} onSend={send} />
    </div>
  )
}
