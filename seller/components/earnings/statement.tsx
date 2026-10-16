"use client"
import * as React from "react"
import { Receipt, Hourglass, CheckCircle2, Undo2 } from "lucide-react"
import { Amount, Banner, Button, Card, EmptyState, Skeleton, StatusBadge, Tabs, cn } from "@ciuna/ui-web"
import { api, ApiError } from "@/lib/api"
import { useErrorText, useT } from "@/lib/i18n"
import { EARNING_STATUS_TONE_WORD, useDate } from "./format"
import { statementStatusParam, type StatementTab } from "./logic"

export interface EarningItem {
  id: string; order_id: string; currency: string; subtotal: number; delivery_fee: number; commission: number; net: number
  status: "pending" | "available" | "reversed"; fulfilled_at: string; release_at: string | null; released_at: string | null
  marketplace_orders: { public_id: string; line: string } | null
  /** Optional until the API exposes it (order_fees snapshot): the commission rule that produced the fee, e.g. "Food 8%". */
  fee_rule?: { line?: string | null; source?: string; percent?: number | null; fixed?: number | null; currency?: string | null } | string | null
  /** Optional: why a reversed row was reversed. */
  reversed_reason?: string | null
}
const LINE_KEY: Record<string, string> = { food: "earnings.rule.food", mart: "earnings.rule.mart", experts: "earnings.rule.experts" }
/** "Food 8%", "Expert services 12%", or "Fixed fee"; null when the API sent no rule. */
function ruleName(i: EarningItem, t: (k: string, v?: Record<string, string | number>) => string): string | null {
  const r = i.fee_rule
  if (!r) return null
  if (typeof r === "string") return r
  const line = r.line && LINE_KEY[r.line] ? t(LINE_KEY[r.line]) : t("earnings.rule.generic")
  if (r.percent !== null && r.percent !== undefined) return t("earnings.rule.percent", { line, percent: Number(r.percent) })
  if (r.fixed !== null && r.fixed !== undefined) return t("earnings.rule.fixed", { line })
  return null
}
const PAGE = 30

/** Statement: one line per fulfilled order, gross, Ciuna fee, net. Table from 1024px, stacked cards below. */
export function Statement() {
  const { t } = useT()
  const errText = useErrorText()
  const date = useDate()
  const [tab, setTab] = React.useState<StatementTab>("all")
  const [items, setItems] = React.useState<EarningItem[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [more, setMore] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const seq = React.useRef(0)

  const load = React.useCallback(async (offset: number) => {
    const id = ++seq.current
    offset ? setMore(true) : setLoading(true)
    try {
      const res = await api<{ items: EarningItem[]; total: number }>(`/api/merchant/earnings/items?limit=${PAGE}&offset=${offset}${statementStatusParam(tab)}`)
      if (id !== seq.current) return
      setItems((prev) => (offset ? [...prev, ...res.items] : res.items))
      setTotal(res.total)
      setError(null)
    } catch (e) {
      if (id === seq.current) setError(errText(e instanceof ApiError ? e.code : undefined))
    } finally {
      if (id === seq.current) { setLoading(false); setMore(false) }
    }
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => { setItems([]); void load(0) }, [load])

  const tabs: Array<{ value: StatementTab; label: string }> = [
    { value: "all", label: t("earnings.tab.all") },
    { value: "pending", label: t("earnings.tab.pending") },
    { value: "available", label: t("earnings.tab.available") },
    { value: "reversed", label: t("earnings.tab.reversed") },
  ]
  const badge = (i: EarningItem) => <StatusBadge status={EARNING_STATUS_TONE_WORD[i.status] ?? "neutral"} label={t(`earnings.item.${i.status}`)} />
  const when = (i: EarningItem) => (i.status === "pending" && i.release_at ? t("earnings.item.availableOn", { date: date(i.release_at) }) : i.status === "available" && date(i.released_at ?? i.release_at) ? t("earnings.item.availableSince", { date: date(i.released_at ?? i.release_at) }) : "")

  return (
    <div className="space-y-4">
      <Tabs value={tab} onChange={setTab} items={tabs} />
      {error ? <Banner tone="destructive" title={error} action={<Button variant="secondary" onClick={() => load(0)}>{t("action.retry")}</Button>} /> : null}
      {loading && !items.length ? <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div> : null}
      {!loading && !items.length && !error ? (
        <Card><EmptyState icon={<Receipt />} title={t(`earnings.empty.${tab}.title`)} description={t(`earnings.empty.${tab}.body`)} /></Card>
      ) : null}

      {items.length ? (
        <>
          <div className="space-y-3 lg:hidden">
            {items.map((i) => {
              const rev = i.status === "reversed"
              const rule = ruleName(i, t)
              const note = when(i)
              return (
                <Card key={i.id} className={cn("p-4", rev && "bg-neutral-surface/60")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="font-semibold">#{i.marketplace_orders?.public_id ?? i.order_id.slice(0, 8)}</p><p className="text-sm text-muted">{date(i.fulfilled_at)}</p></div>
                    {badge(i)}
                  </div>
                  <dl className={cn("mt-3 space-y-1.5 text-sm", rev && "text-muted")}>
                    <Row label={t("earnings.col.items")}><Amount value={i.subtotal} currency={i.currency} breakdown className={cn(rev && "line-through")} /></Row>
                    {i.delivery_fee ? <Row label={t("earnings.col.delivery")}><Amount value={i.delivery_fee} currency={i.currency} breakdown className={cn(rev && "line-through")} /></Row> : null}
                    <div>
                      <Row label={t("earnings.col.fee")}><Amount value={-i.commission} currency={i.currency} breakdown signed className={cn(rev ? "line-through" : "text-destructive-text")} /></Row>
                      {rule ? <p className="text-xs text-muted">{rule}</p> : null}
                    </div>
                    <div className="flex items-baseline justify-between border-t border-hairline pt-2"><dt className="font-semibold text-ink">{t(rev ? "earnings.item.keep" : "earnings.col.net")}</dt><dd><Amount value={rev ? 0 : i.net} currency={i.currency} size="large" breakdown /></dd></div>
                  </dl>
                  {rev && i.reversed_reason ? <p className="mt-2 text-sm text-muted">{i.reversed_reason}</p> : null}
                  {note ? (
                    <p className="mt-3 flex items-center gap-2 rounded-xl bg-neutral-surface px-3 py-2 text-sm text-neutral-text">
                      {i.status === "pending" ? <Hourglass className="size-4 shrink-0" aria-hidden /> : <CheckCircle2 className="size-4 shrink-0" aria-hidden />}
                      {note}
                    </p>
                  ) : rev ? <p className="mt-3 flex items-center gap-2 rounded-xl bg-neutral-surface px-3 py-2 text-sm text-neutral-text"><Undo2 className="size-4 shrink-0" aria-hidden />{t("earnings.item.reversedNote")}</p> : null}
                </Card>
              )
            })}
          </div>

          <Card className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-[15px]">
              <thead>
                <tr className="border-b border-hairline text-sm text-muted">
                  <th className="px-4 py-3 font-semibold">{t("earnings.col.order")}</th>
                  <th className="px-4 py-3 font-semibold">{t("earnings.col.date")}</th>
                  <th className="px-4 py-3 text-right font-semibold">{t("earnings.col.items")}</th>
                  <th className="px-4 py-3 text-right font-semibold">{t("earnings.col.delivery")}</th>
                  <th className="px-4 py-3 text-right font-semibold">{t("earnings.col.fee")}</th>
                  <th className="px-4 py-3 text-right font-semibold">{t("earnings.col.net")}</th>
                  <th className="px-4 py-3 font-semibold">{t("earnings.col.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {items.map((i) => (
                  <tr key={i.id} className={cn(i.status === "reversed" && "text-muted [&_td:not(:last-child)]:line-through")}>
                    <td className="px-4 py-3 font-semibold">#{i.marketplace_orders?.public_id ?? i.order_id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-muted">{date(i.fulfilled_at)}</td>
                    <td className="px-4 py-3 text-right"><Amount value={i.subtotal} currency={i.currency} /></td>
                    <td className="px-4 py-3 text-right"><Amount value={i.delivery_fee} currency={i.currency} /></td>
                    <td className="px-4 py-3 text-right"><Amount value={-i.commission} currency={i.currency} />{ruleName(i, t) ? <p className="text-xs text-muted no-underline">{ruleName(i, t)}</p> : null}</td>
                    <td className="px-4 py-3 text-right font-semibold"><Amount value={i.net} currency={i.currency} breakdown /></td>
                    <td className="px-4 py-3"><div className="flex flex-col items-start gap-1">{badge(i)}{when(i) ? <span className="text-xs text-muted">{when(i)}</span> : null}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {items.length < total ? (
            <div className="flex justify-center"><Button variant="secondary" busy={more} onClick={() => load(items.length)}>{t("earnings.loadMore")}</Button></div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-baseline justify-between gap-3"><dt className="text-muted">{label}</dt><dd>{children}</dd></div>
}
