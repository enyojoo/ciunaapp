"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { OfficeDashboardLayout } from "@/components/layout/office-dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ErrorBanner } from "@/components/finance/finance-ui"
import { fapi, formatMoney } from "@/components/finance/finance-lib"

interface Analytics {
  range: { from: string; to: string }
  money: Array<{ currency: string; gmv: number; commission: number; orders: number; takeRate: number }>
  orders: Array<{ line: string; paid: number; fulfilled: number; cancelled: number; open: number; fulfilmentRate: number | null; cancellationRate: number | null }>
  merchants: { live: number; officeManaged: number; inReview: number; newInRange: number; approvedInRange: number; activeInRange: number }
  applications: Record<string, number>
  reviewMedianHours: number | null
  acceptMedianMinutes: number | null
  timeToFirstOrderMedianHours: number | null
  payouts: Array<{ status: string; currency: string; count: number; amount: number }>
  daily: Array<{ day: string; orders: number; currency: string; gmv: number }>
  topMerchants: Array<{ merchantId: string; name: string; currency: string; gmv: number; orders: number }>
}

const PRESETS = [{ label: "7 days", days: 7 }, { label: "30 days", days: 30 }, { label: "90 days", days: 90 }]
const iso = (d: Date) => d.toISOString().slice(0, 10)
const num = (v: unknown) => Number(v ?? 0)
const pct = (v: number | null) => (v === null || v === undefined ? "—" : `${v}%`)
const hours = (v: number | null) => (v === null || v === undefined ? "—" : v < 48 ? `${v} h` : `${Math.round(v / 24)} days`)
const mins = (v: number | null) => (v === null || v === undefined ? "—" : `${v} min`)

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  )
}

/** Daily GMV bars for one currency. The table below is the accessible equivalent. */
function DailyBars({ rows, currency }: { rows: Analytics["daily"]; currency: string }) {
  const data = rows.filter((r) => r.currency === currency)
  const max = Math.max(1, ...data.map((r) => num(r.gmv)))
  if (!data.length) return <p className="text-sm text-muted-foreground">No fulfilled orders in this period.</p>
  return (
    <div role="img" aria-label={`Daily GMV in ${currency}`} className="flex h-40 items-end gap-1">
      {data.map((r) => (
        <div key={r.day} className="group relative flex-1 min-w-[3px]" title={`${r.day}: ${formatMoney(num(r.gmv), currency)} · ${r.orders} orders`}>
          <div className="w-full rounded-t bg-primary" style={{ height: `${Math.max(2, (num(r.gmv) / max) * 100)}%` }} />
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState<Analytics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    const to = new Date(); const from = new Date(Date.now() - (days - 1) * 86400000)
    const res = await fapi<Analytics>(`/api/admin/analytics/marketplace?from=${iso(from)}&to=${iso(to)}`)
    if (res.ok) { setData(res.data); setCurrency((c) => c ?? res.data.money[0]?.currency ?? null) } else setError(res.error)
    setLoading(false)
  }, [days])
  useEffect(() => { void load() }, [load])

  const m = data?.money.find((x) => x.currency === currency) ?? data?.money[0]
  const totalOrders = useMemo(() => data?.orders.reduce((a, o) => ({ paid: a.paid + o.paid, fulfilled: a.fulfilled + o.fulfilled, cancelled: a.cancelled + o.cancelled }), { paid: 0, fulfilled: 0, cancelled: 0 }), [data])
  const closed = (totalOrders?.fulfilled ?? 0) + (totalOrders?.cancelled ?? 0)

  return (
    <OfficeDashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Marketplace analytics</h1>
            <p className="text-sm text-muted-foreground">Sellers, orders and money for the last {days} days (UTC).</p>
          </div>
          <div className="flex items-center gap-2" role="group" aria-label="Period">
            {PRESETS.map((p) => (
              <Button key={p.days} size="sm" variant={days === p.days ? "default" : "outline"} aria-pressed={days === p.days} onClick={() => setDays(p.days)}>{p.label}</Button>
            ))}
          </div>
        </div>

        {error ? <ErrorBanner message={error} /> : null}
        {loading && !data ? <p className="text-sm text-muted-foreground">Loading</p> : null}

        {data ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {data.money.length > 1 ? data.money.map((x) => (
                <Button key={x.currency} size="sm" variant={x.currency === (m?.currency) ? "default" : "outline"} onClick={() => setCurrency(x.currency)}>{x.currency}</Button>
              )) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Tile label="Gross merchandise value" value={m ? formatMoney(num(m.gmv), m.currency) : "—"} hint={m ? `${m.orders} fulfilled orders` : "No fulfilled orders yet"} />
              <Tile label="Ciuna commission" value={m ? formatMoney(num(m.commission), m.currency) : "—"} hint={m ? `Take rate ${num(m.takeRate)}% of item value` : undefined} />
              <Tile label="Fulfilment rate" value={closed ? pct(Math.round(((totalOrders?.fulfilled ?? 0) / closed) * 1000) / 10) : "—"} hint={`${totalOrders?.paid ?? 0} paid orders`} />
              <Tile label="Cancellation rate" value={closed ? pct(Math.round(((totalOrders?.cancelled ?? 0) / closed) * 1000) / 10) : "—"} hint="Of orders that finished" />
              <Tile label="Active sellers" value={String(data.merchants.activeInRange)} hint={`${data.merchants.live} live · ${data.merchants.officeManaged} Office-managed`} />
              <Tile label="New sellers" value={String(data.merchants.newInRange)} hint={`${data.merchants.approvedInRange} approved · ${data.merchants.inReview} in review now`} />
              <Tile label="Median time to accept" value={mins(data.acceptMedianMinutes)} hint="From payment to acceptance" />
              <Tile label="Median time to first order" value={hours(data.timeToFirstOrderMedianHours)} hint="From approval to first fulfilled order" />
            </div>

            <Card className="p-4">
              <h2 className="mb-3 text-base font-semibold">Daily GMV {m ? `(${m.currency})` : ""}</h2>
              {m ? <DailyBars rows={data.daily} currency={m.currency} /> : <p className="text-sm text-muted-foreground">No fulfilled orders in this period.</p>}
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="overflow-x-auto">
                <h2 className="px-4 pt-4 text-base font-semibold">Orders by section</h2>
                <Table>
                  <TableHeader><TableRow><TableHead>Section</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Fulfilled</TableHead><TableHead className="text-right">Cancelled</TableHead><TableHead className="text-right">Open</TableHead><TableHead className="text-right">Fulfilment</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.orders.length ? data.orders.map((o) => (
                      <TableRow key={o.line}><TableCell className="capitalize">{o.line}</TableCell><TableCell className="text-right tabular-nums">{o.paid}</TableCell><TableCell className="text-right tabular-nums">{o.fulfilled}</TableCell><TableCell className="text-right tabular-nums">{o.cancelled}</TableCell><TableCell className="text-right tabular-nums">{o.open}</TableCell><TableCell className="text-right tabular-nums">{pct(o.fulfilmentRate)}</TableCell></TableRow>
                    )) : <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No seller orders in this period.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </Card>

              <Card className="overflow-x-auto">
                <h2 className="px-4 pt-4 text-base font-semibold">Top sellers by GMV</h2>
                <Table>
                  <TableHeader><TableRow><TableHead>Seller</TableHead><TableHead className="text-right">Orders</TableHead><TableHead className="text-right">GMV</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.topMerchants.length ? data.topMerchants.map((t) => (
                      <TableRow key={`${t.merchantId}-${t.currency}`}><TableCell><a className="text-primary-text hover:underline" href={`/finance/merchants/${t.merchantId}`}>{t.name}</a></TableCell><TableCell className="text-right tabular-nums">{t.orders}</TableCell><TableCell className="text-right tabular-nums">{formatMoney(num(t.gmv), t.currency)}</TableCell></TableRow>
                    )) : <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Nothing yet.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </Card>

              <Card className="p-4">
                <h2 className="mb-3 text-base font-semibold">Applications</h2>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {Object.entries(data.applications).length ? Object.entries(data.applications).map(([k, v]) => (<div key={k} className="contents"><dt className="capitalize text-muted-foreground">{k.replace(/_/g, " ")}</dt><dd className="text-right tabular-nums">{v}</dd></div>)) : <p className="col-span-2 text-muted-foreground">No applications in this period.</p>}
                  <dt className="text-muted-foreground">Median review time</dt><dd className="text-right tabular-nums">{hours(data.reviewMedianHours)}</dd>
                </dl>
              </Card>

              <Card className="overflow-x-auto">
                <h2 className="px-4 pt-4 text-base font-semibold">Payouts requested</h2>
                <Table>
                  <TableHeader><TableRow><TableHead>Status</TableHead><TableHead className="text-right">Count</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.payouts.length ? data.payouts.map((p) => (
                      <TableRow key={`${p.status}-${p.currency}`}><TableCell className="capitalize">{p.status}</TableCell><TableCell className="text-right tabular-nums">{p.count}</TableCell><TableCell className="text-right tabular-nums">{formatMoney(num(p.amount), p.currency)}</TableCell></TableRow>
                    )) : <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No payouts in this period.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </OfficeDashboardLayout>
  )
}
