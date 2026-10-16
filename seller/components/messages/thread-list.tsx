"use client"
import * as React from "react"
import { MessageSquare } from "lucide-react"
import { Banner, Button, EmptyState, Skeleton } from "@ciuna/ui-web"
import { api } from "@/lib/api"
import { useQuery } from "@/lib/query"
import { useErrorText, useT } from "@/lib/i18n"
import { ThreadRow } from "./thread-row"
import type { Thread } from "./format"

interface ListResponse { threads: Thread[]; unread: number }

/** Thread list with its loading, error and empty states. Used as the list page on phones and the left pane of the desktop split view. */
export function ThreadList({ selectedId }: { selectedId?: string | null }) {
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
  if (loading && !data) return <div className="space-y-3" aria-busy="true">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}</div>
  if (error && !data) return <Banner tone="destructive" title={errText(error.code)} action={retry} />
  if (data && data.threads.length === 0) return <EmptyState icon={<MessageSquare />} title={t("messages.empty.title")} description={t("messages.empty.body")} />
  return (
    <>
      {error ? <div className="mb-3"><Banner tone="warning" title={errText(error.code)} action={retry} /></div> : null}
      <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
        {data?.threads.map((th) => <li key={th.orderId} className="contents"><ThreadRow thread={th} selected={selectedId === th.orderId} /></li>)}
      </ul>
    </>
  )
}
