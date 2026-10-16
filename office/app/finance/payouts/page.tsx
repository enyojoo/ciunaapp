"use client"

import { useCallback, useEffect, useState } from "react"
import { OfficeDashboardLayout } from "@/components/layout/office-dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RelativeAge } from "@/components/merchants/relative-age"
import { ErrorBanner, FinanceStatusBadge } from "@/components/finance/finance-ui"
import { PayoutPanel, payoutNet } from "@/components/finance/payout-panel"
import { fapi, formatDateTime, formatMoney, kindLabel, type PayoutRow } from "@/components/finance/finance-lib"
import { useAuth } from "@/lib/auth-context"

const PAGE = 50
const TABS = [
  { value: "open", label: "Open" },
  { value: "paid", label: "Paid" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
]

export default function PayoutsPage() {
  const { adminRole } = useAuth()
  const [tab, setTab] = useState("open")
  const [offset, setOffset] = useState(0)
  const [rows, setRows] = useState<PayoutRow[]>([])
  const [total, setTotal] = useState(0)
  const [openCount, setOpenCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<PayoutRow | null>(null)

  const countOpen = useCallback(async () => {
    const res = await fapi<{ total: number }>("/api/admin/payouts?limit=1")
    if (res.ok) setOpenCount(res.data.total)
  }, [])

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    const p = new URLSearchParams({ limit: String(PAGE), offset: String(offset) })
    if (tab !== "open") p.set("status", tab)
    const res = await fapi<{ payouts: PayoutRow[]; total: number }>(`/api/admin/payouts?${p}`)
    if (res.ok) {
      setRows(res.data.payouts); setTotal(res.data.total)
      if (tab === "open") setOpenCount(res.data.total)
    } else setError(res.error)
    setLoading(false)
  }, [tab, offset])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (tab !== "open") countOpen() }, [tab, countOpen])

  const changed = () => { load(); countOpen() }
  const dateCol = tab === "paid" ? "Paid" : tab === "open" ? "Requested" : "Decided"

  return (
    <OfficeDashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Payouts</h1>
          <p className="text-sm text-muted-foreground">Review merchant payout requests, then pay them out by bank transfer or SBP and record the reference.</p>
        </div>

        <Tabs value={tab} onValueChange={(v) => { setTab(v); setOffset(0) }}>
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}{t.value === "open" && openCount !== null ? ` (${openCount})` : ""}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <ErrorBanner message={error} />

        <Card className="overflow-hidden">
          <div className="max-h-[calc(100vh-18rem)] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Fee</TableHead>
                  <TableHead className="text-right">Net payable</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>{tab === "open" ? "Age" : dateCol}</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && rows.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Loading...</TableCell></TableRow>
                )}
                {!loading && rows.length === 0 && !error && (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    {tab === "open" ? "No payouts waiting." : "No payouts here."}
                  </TableCell></TableRow>
                )}
                {rows.map((r) => {
                  const m = r.method_snapshot || {}
                  const old = Date.now() - new Date(r.requested_at).getTime() > 48 * 3600 * 1000
                  const when = tab === "paid" ? r.paid_at : r.decided_at
                  return (
                    <TableRow key={r.id} tabIndex={0} className="cursor-pointer" onClick={() => setSelected(r)}
                      onKeyDown={(e) => { if (e.key === "Enter") setSelected(r) }}>
                      <TableCell>
                        <div className="font-medium">{r.merchants?.display_name || "Merchant"}</div>
                        <div className="text-xs text-muted-foreground">{r.merchants?.country}</div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoney(r.amount, r.currency)}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{formatMoney(r.fee, r.currency)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatMoney(payoutNet(r), r.currency)}</TableCell>
                      <TableCell>
                        <div className="text-sm">{kindLabel(m.kind)}{m.last4 ? ` ****${m.last4}` : ""}</div>
                        <div className="text-xs text-muted-foreground">{m.label}</div>
                      </TableCell>
                      <TableCell>
                        {tab === "open"
                          ? <RelativeAge iso={r.requested_at} warn={old} />
                          : <span className="text-sm text-muted-foreground">{formatDateTime(when || r.requested_at)}</span>}
                        {tab === "open" && old && <span className="ml-1 text-xs text-warning-text">over 48h</span>}
                      </TableCell>
                      <TableCell><FinanceStatusBadge status={r.status} /></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total === 0 ? "0 payouts" : `${offset + 1}-${Math.min(offset + PAGE, total)} of ${total}`}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - PAGE))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={offset + PAGE >= total || loading} onClick={() => setOffset(offset + PAGE)}>Next</Button>
          </div>
        </div>
      </div>

      <PayoutPanel payout={selected} role={adminRole} onClose={() => setSelected(null)} onChanged={changed} />
    </OfficeDashboardLayout>
  )
}
