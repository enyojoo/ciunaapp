"use client"
import * as React from "react"
import { MessageSquare } from "lucide-react"
import { Banner, Button, EmptyState, PageHeader, Skeleton } from "@ciuna/ui-web"
import { SellerNoAccess } from "@/components/no-access"
import { api } from "@/lib/api"
import { useQuery } from "@/lib/query"
import { useSeller } from "@/lib/session"
import { useErrorText, useT } from "@/lib/i18n"
import { ThreadRow } from "@/components/messages/thread-row"
import type { Thread } from "@/components/messages/format"

interface ListResponse { threads: Thread[]; unread: number }

export default function MessagesPage() {
  const { t } = useT()
  const { can } = useSeller()
  if (!can("messages")) {
    return (
      <SellerNoAccess pageTitle={t("messages.title")} titleKey="messages.noAccess.title" bodyKey="messages.noAccess.body" />
    )
  }
  return <Threads />
}

function Threads() {
  const { t } = useT()
  const errText = useErrorText()
  const { data, error, loading, reload } = useQuery<ListResponse>("messages:list", () => api<ListResponse>("/api/merchant/messages"), { refreshMs: 30_000 })
  const unread = data?.unread ?? 0

  React.useEffect(() => {
    const base = t("messages.title")
    document.title = unread ? `(${unread}) ${base}` : base
    return () => { document.title = base }
  }, [unread, t])

  const retry = <Button size="sm" variant="secondary" onClick={() => void reload()}>{t("action.retry")}</Button>
  return (
    <>
      <PageHeader title={t("messages.title")} description={t("messages.subtitle")} />
      {loading && !data ? (
        <div className="space-y-3" aria-busy="true">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : error && !data ? (
        <Banner tone="destructive" title={errText(error.code)} action={retry} />
      ) : data && data.threads.length === 0 ? (
        <EmptyState icon={<MessageSquare />} title={t("messages.empty.title")} description={t("messages.empty.body")} />
      ) : (
        <>
          {error ? <div className="mb-3"><Banner tone="warning" title={errText(error.code)} action={retry} /></div> : null}
          <ul className="grid gap-3 md:grid-cols-2">
            {data?.threads.map((th) => <li key={th.orderId} className="contents"><ThreadRow thread={th} /></li>)}
          </ul>
        </>
      )}
    </>
  )
}
