"use client"
import * as React from "react"
import Link from "next/link"
import { Clock, Package, Plus, Search, Truck, Upload, XCircle } from "lucide-react"
import { Amount, Banner, Button, Card, EmptyState, Input, PageHeader, Skeleton, StatusBadge, Switch, Tabs, useToast } from "@ciuna/ui-web"
import { api, ApiError } from "@/lib/api"
import { invalidate, useQuery } from "@/lib/query"
import { useSeller } from "@/lib/session"
import { useErrorText, useT } from "@/lib/i18n"
import { PRODUCTS_KEY, type Product } from "@/components/catalog/shared"

type Filter = "all" | "live" | "draft" | "archived"
type Resp = { products: Product[]; total: number }

export default function CatalogPage() {
  const { t } = useT()
  const errText = useErrorText()
  const toast = useToast()
  const { merchant } = useSeller()
  const [filter, setFilter] = React.useState<Filter>("all")
  const [text, setText] = React.useState("")
  const [term, setTerm] = React.useState("")
  const [pending, setPending] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    const id = setTimeout(() => setTerm(text.trim()), 300)
    return () => clearTimeout(id)
  }, [text])

  const key = `${PRODUCTS_KEY}:${filter}:${term}`
  const q = useQuery<Resp>(key, () => {
    const p = new URLSearchParams({ limit: "200" })
    if (filter !== "all") p.set("status", filter)
    if (term) p.set("q", term)
    return api<Resp>(`/api/merchant/products?${p}`)
  })
  const products = q.data?.products ?? []
  const canPublish = merchant?.status === "live"

  /** Optimistic PATCH: apply now, roll back and say why if the API refuses. */
  async function patch(p: Product, change: Partial<Product>, okMessage: string) {
    if (pending.has(p.id)) return
    const apply = (fn: (x: Product) => Product) => q.setData((d) => (d ? { ...d, products: d.products.map((x) => (x.id === p.id ? fn(x) : x)) } : d))
    setPending((s) => new Set(s).add(p.id))
    apply((x) => ({ ...x, ...change }))
    try {
      const body: Record<string, unknown> = {}
      if ("sold_out" in change) body.sold_out = change.sold_out
      if ("status" in change) body.status = change.status
      const res = await api<{ product: Product }>(`/api/merchant/products/${p.id}`, { method: "PATCH", json: body })
      apply(() => res.product)
      invalidate(PRODUCTS_KEY)
      toast.show(okMessage)
    } catch (e) {
      apply((x) => ({ ...x, sold_out: p.sold_out, status: p.status }))
      toast.show(errText(e instanceof ApiError ? e.code : undefined), "error")
    } finally {
      setPending((s) => { const n = new Set(s); n.delete(p.id); return n })
    }
  }
  const tabs: Array<{ value: Filter; label: string }> = [
    { value: "all", label: t("catalog.tab.all") },
    { value: "live", label: t("catalog.tab.live") },
    { value: "draft", label: t("catalog.tab.draft") },
    { value: "archived", label: t("catalog.tab.archived") },
  ]
  const firstLoad = q.loading && !q.data
  const nothingAtAll = !firstLoad && products.length === 0 && filter === "all" && !term

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title={t("catalog.title")}
        description={t("catalog.intro")}
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="lg" className="hidden sm:inline-flex"><Link href="/catalog/import"><Upload />{t("catalog.action.import")}</Link></Button>
            <Button asChild size="lg"><Link href="/catalog/new"><Plus />{t("catalog.action.add")}</Link></Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold">
        <Link href="/catalog/fulfillment" className="inline-flex min-h-11 items-center gap-1.5 text-primary-text hover:underline"><Truck className="size-4" />{t("catalog.link.fulfilment")}</Link>
        <Link href="/catalog/import" className="inline-flex min-h-11 items-center gap-1.5 text-primary-text hover:underline sm:hidden"><Upload className="size-4" />{t("catalog.action.import")}</Link>
      </div>

      {!canPublish && merchant ? <div className="mb-4"><Banner tone="neutral" title={t("catalog.form.publishLater")} /></div> : null}

      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("catalog.search")} aria-label={t("catalog.search")} className="h-12 pl-10 md:h-11" />
        </div>
        <Tabs value={filter} onChange={setFilter} items={tabs} />
      </div>

      {q.error && !q.data ? (
        <Banner tone="destructive" title={errText(q.error.code)} action={<Button size="sm" variant="secondary" onClick={() => void q.reload()}>{t("action.retry")}</Button>} />
      ) : firstLoad ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : products.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Package />}
            title={nothingAtAll ? t("catalog.empty.title") : t("catalog.empty.noMatch")}
            description={nothingAtAll ? t("catalog.empty.body") : undefined}
            action={nothingAtAll ? <Button asChild size="lg"><Link href="/catalog/new"><Plus />{t("catalog.action.add")}</Link></Button> : undefined}
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {products.map((p) => (
            <li key={p.id}>
              <ProductRow product={p} busy={pending.has(p.id)} canPublish={canPublish} onSoldOut={(v) => patch(p, { sold_out: v }, v ? t("catalog.toast.soldOutOn") : t("catalog.toast.soldOutOff"))} onStatus={() => (p.status === "live" ? patch(p, { status: "draft" }, t("catalog.toast.paused")) : patch(p, { status: "live" }, t("catalog.toast.published")))} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ProductRow({ product: p, busy, canPublish, onSoldOut, onStatus }: { product: Product; busy: boolean; canPublish: boolean; onSoldOut: (v: boolean) => void; onStatus: () => void }) {
  const { t } = useT()
  const sale = p.sale_price !== null && p.sale_price !== undefined && Number(p.sale_price) > 0
  const stock = p.sold_out ? t("catalog.stock.soldOut") : p.stock_quantity === null ? t("catalog.stock.unlimited") : t("catalog.stock.count", { n: p.stock_quantity })
  const archived = p.status === "archived"
  return (
    <Card className="p-3 sm:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-4">
        <Link href={`/catalog/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-neutral-surface xl:size-14">
            {p.image_url ? <img src={p.image_url} alt="" className="aspect-square size-full object-cover" /> : <div className="flex size-full items-center justify-center text-muted"><Package className="size-5" aria-hidden /></div>}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-ink">{p.title}</p>
            <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
              <Amount value={sale ? p.sale_price : p.list_price} currency={p.fixed_currency} className="font-semibold text-ink" />
              {sale ? <Amount value={p.list_price} currency={p.fixed_currency} className="text-sm text-muted line-through" /> : null}
            </p>
            {p.review_status === "pending" ? (
              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-warning-text"><Clock className="size-3.5" aria-hidden />{t("catalog.review.pending")}</p>
            ) : p.review_status === "rejected" ? (
              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-destructive-text"><XCircle className="size-3.5 shrink-0" aria-hidden /><span className="line-clamp-2">{t("catalog.review.rejected", { note: p.review_note ?? "" })}</span></p>
            ) : null}
          </div>
        </Link>
        <div className="flex flex-wrap items-center gap-2 xl:w-48 xl:flex-col xl:items-start xl:gap-1.5">
          <StatusBadge status={p.status} label={t(`catalog.status.${p.status}`)} />
          <span className={p.sold_out ? "rounded-full bg-destructive-surface px-2.5 py-1 text-xs font-semibold text-destructive-text" : "rounded-full bg-neutral-surface px-2.5 py-1 text-xs font-semibold text-neutral-text"}>{stock}</span>
        </div>
        {!archived ? (
          <div className="flex items-center justify-between gap-3 border-t border-hairline pt-3 xl:w-72 xl:justify-end xl:border-0 xl:pt-0">
            <label className="flex min-h-12 items-center gap-2.5 text-sm font-medium text-ink">
              <Switch checked={p.sold_out} onCheckedChange={onSoldOut} disabled={busy} label={t("catalog.stock.soldOutToggle", { title: p.title })} />
              {t("catalog.stock.soldOut")}
            </label>
            <Button type="button" variant="secondary" className="h-12 xl:h-11" disabled={busy || (p.status !== "live" && !canPublish)} onClick={onStatus} title={p.status !== "live" && !canPublish ? t("catalog.form.publishLater") : undefined}>
              {p.status === "live" ? t("catalog.action.pause") : t("catalog.action.publish")}
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  )
}
