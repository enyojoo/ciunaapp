"use client"
import * as React from "react"
import { Inbox } from "lucide-react"
import { Button, EmptyState, PageHeader, Skeleton, Tabs, Banner, useToast } from "@ciuna/ui-web"
import { SellerNoAccess } from "@/components/no-access"
import { api } from "@/lib/api"
import { useQuery } from "@/lib/query"
import { useSeller } from "@/lib/session"
import { useErrorText, useT } from "@/lib/i18n"
import { OrderCard } from "@/components/orders/order-card"
import { useMedia } from "@/hooks/use-media"
import type { OrderTab, SellerOrder } from "@/components/orders/format"

interface ListResponse { orders: SellerOrder[]; total: number; counts: { new: number; active: number } }

export default function OrdersPage() {
  const { t } = useT()
  const { can } = useSeller()
  if (!can("orders")) {
    return (
      <SellerNoAccess pageTitle={t("orders.title")} titleKey="orders.noAccess.title" bodyKey="orders.noAccess.body" />
    )
  }
  return <OrdersList />
}

function OrdersList() {
  const { t } = useT()
  const errText = useErrorText()
  const toast = useToast()
  const wide = useMedia("(min-width: 1024px)")
  const [tab, setTab] = React.useState<OrderTab>("new")
  // Desktop shows New, Accepted and Preparing side by side ("board"); Completed and Cancelled stay as tabs.
  const board = wide && (tab === "new" || tab === "active")
  const { data, error, loading, reload } = useQuery<ListResponse>(`orders:list:${board ? "new" : tab}`, () => api<ListResponse>(`/api/merchant/orders?status=${board ? "new" : tab}&limit=50`), { refreshMs: 30_000 })
  const active = useQuery<ListResponse>(board ? "orders:list:active" : null, () => api<ListResponse>("/api/merchant/orders?status=active&limit=50"), { refreshMs: 30_000 })

  // New-order alert: toast when the New count rises between polls. The toast region is aria-live.
  const prevNew = React.useRef<number | null>(null)
  const newCount = data?.counts.new
  React.useEffect(() => {
    if (typeof newCount !== "number") return
    if (prevNew.current !== null && newCount > prevNew.current) toast.show(t("orders.toast.newOrder"))
    prevNew.current = newCount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newCount])

  React.useEffect(() => {
    const base = t("orders.title")
    document.title = newCount ? `(${newCount}) ${base}` : base
    return () => { document.title = base }
  }, [newCount, t])

  const tabs = [
    ...(wide
      ? [{ value: "new" as const, label: t("orders.tab.board"), count: data?.counts.new }]
      : [
          { value: "new" as const, label: t("orders.tab.new"), count: data?.counts.new },
          { value: "active" as const, label: t("orders.tab.active"), count: data?.counts.active },
        ]),
    { value: "done" as const, label: t("orders.tab.done") },
    { value: "cancelled" as const, label: t("orders.tab.cancelled") },
  ]

  return (
    <>
      <PageHeader title={t("orders.title")} description={t("orders.subtitle")} />
      <Tabs value={board ? "new" : tab} onChange={setTab} items={tabs} className="mb-4" />
      <div role="tabpanel" aria-busy={loading}>
        {board && data && !error ? (
          <Board newOrders={data.orders} active={active.data?.orders} loadingActive={active.loading && !active.data} onChanged={() => { void reload(); void active.reload() }} />
        ) : loading && !data ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-44" />)}
          </div>
        ) : error && !data ? (
          <Banner tone="destructive" title={errText(error.code)} action={<Button size="sm" variant="secondary" onClick={() => void reload()}>{t("action.retry")}</Button>} />
        ) : data && data.orders.length === 0 ? (
          <EmptyState icon={<Inbox />} title={t(`orders.empty.${tab}.title`)} description={t(`orders.empty.${tab}.body`)} />
        ) : (
          <>
            {error ? <div className="mb-3"><Banner tone="warning" title={errText(error.code)} action={<Button size="sm" variant="secondary" onClick={() => void reload()}>{t("action.retry")}</Button>} /></div> : null}
            <ul className="grid gap-3 md:grid-cols-2">
              {data?.orders.map((o) => (
                <li key={o.id} className="contents"><OrderCard order={o} onChanged={() => void reload()} /></li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  )
}

function Board({ newOrders, active, loadingActive, onChanged }: { newOrders: SellerOrder[]; active?: SellerOrder[]; loadingActive: boolean; onChanged: () => void }) {
  const { t } = useT()
  const cols: Array<{ key: string; label: string; orders: SellerOrder[] | undefined }> = [
    { key: "new", label: t("orders.status.new"), orders: newOrders },
    { key: "accepted", label: t("orders.status.accepted"), orders: active?.filter((o) => o.status === "accepted") },
    { key: "preparing", label: t("orders.status.preparing"), orders: active?.filter((o) => o.status === "preparing") },
  ]
  return (
    <div className="grid grid-cols-3 items-start gap-4">
      {cols.map((c) => (
        <section key={c.key} aria-label={c.label} className="min-w-0 rounded-2xl bg-neutral-surface p-3">
          <h2 className="mb-3 flex items-center justify-between px-1 text-sm font-semibold text-ink">
            {c.label}
            <span className="min-w-6 rounded-full bg-white px-2 py-0.5 text-center text-xs font-bold tabular-nums text-muted">{c.orders?.length ?? "–"}</span>
          </h2>
          {c.orders === undefined && loadingActive ? <Skeleton className="h-32" /> : c.orders && c.orders.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {c.orders.map((o) => <li key={o.id} className="contents"><OrderCard compact order={o} onChanged={onChanged} /></li>)}
            </ul>
          ) : <p className="px-1 py-6 text-center text-sm text-muted">{t("orders.board.empty")}</p>}
        </section>
      ))}
    </div>
  )
}
