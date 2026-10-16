"use client"
import * as React from "react"
import { Inbox, Lock } from "lucide-react"
import { Button, EmptyState, PageHeader, Skeleton, Tabs, Banner, useToast } from "@ciuna/ui-web"
import { api } from "@/lib/api"
import { useQuery } from "@/lib/query"
import { useSeller } from "@/lib/session"
import { useErrorText, useT } from "@/lib/i18n"
import { OrderCard } from "@/components/orders/order-card"
import type { OrderTab, SellerOrder } from "@/components/orders/format"

interface ListResponse { orders: SellerOrder[]; total: number; counts: { new: number; active: number } }

export default function OrdersPage() {
  const { t } = useT()
  const { can } = useSeller()
  if (!can("orders")) {
    return (
      <>
        <PageHeader title={t("orders.title")} />
        <EmptyState icon={<Lock />} title={t("orders.noAccess.title")} description={t("orders.noAccess.body")} />
      </>
    )
  }
  return <OrdersList />
}

function OrdersList() {
  const { t } = useT()
  const errText = useErrorText()
  const toast = useToast()
  const [tab, setTab] = React.useState<OrderTab>("new")
  const { data, error, loading, reload } = useQuery<ListResponse>(`orders:list:${tab}`, () => api<ListResponse>(`/api/merchant/orders?status=${tab}&limit=50`), { refreshMs: 30_000 })

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
    { value: "new" as const, label: t("orders.tab.new"), count: data?.counts.new },
    { value: "active" as const, label: t("orders.tab.active"), count: data?.counts.active },
    { value: "done" as const, label: t("orders.tab.done") },
    { value: "cancelled" as const, label: t("orders.tab.cancelled") },
  ]

  return (
    <>
      <PageHeader title={t("orders.title")} description={t("orders.subtitle")} />
      <Tabs value={tab} onChange={setTab} items={tabs} className="mb-4" />
      <div role="tabpanel" aria-busy={loading}>
        {loading && !data ? (
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
