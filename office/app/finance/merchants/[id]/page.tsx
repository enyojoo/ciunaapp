"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { OfficeDashboardLayout } from "@/components/layout/office-dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ErrorBanner, FinanceStatusBadge, NoticeBanner, VerifiedBadge } from "@/components/finance/finance-ui"
import { canFinance, fapi, formatDateTime, formatMoney, jsonBody, kindLabel, type PayoutMethod } from "@/components/finance/finance-lib"
import { useAuth } from "@/lib/auth-context"

interface Balance { currency: string; pending: number; available: number; inPayout: number; paidOut: number; lifetimeNet: number }
interface Earning {
  id: string; order_id: string; currency: string; subtotal: number | string; delivery_fee: number | string
  commission: number | string; net: number | string; status: string; fulfilled_at: string | null; release_at: string | null
  marketplace_orders?: { public_id?: string } | null
}
interface PayoutLite { id: string; currency: string; amount: number | string; fee: number | string; net: number | string; status: string; requested_at: string; paid_at: string | null; reference: string | null }
interface Ledger { balances: Balance[]; earnings: Earning[]; payouts: PayoutLite[]; methods: PayoutMethod[] }

const Th = ({ children, right }: { children: React.ReactNode; right?: boolean }) => <TableHead className={right ? "text-right" : undefined}>{children}</TableHead>
const Num = ({ children }: { children: React.ReactNode }) => <TableCell className="text-right tabular-nums">{children}</TableCell>

export default function MerchantMoneyPage() {
  const { id } = useParams<{ id: string }>()
  const { adminRole } = useAuth()
  const act = canFinance(adminRole)
  const [name, setName] = useState<string>("")
  const [d, setD] = useState<Ledger | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const res = await fapi<Ledger>(`/api/admin/merchants/${id}/ledger`)
    if (res.ok) { setD(res.data); setError(null) } else setError(res.error)
  }, [id])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    fapi<{ merchant: { display_name: string } }>(`/api/admin/merchants/${id}`).then((r) => { if (r.ok) setName(r.data.merchant.display_name) })
  }, [id])

  const verify = async (m: PayoutMethod, verified: boolean) => {
    setBusy(true); setNotice(null)
    const res = await fapi(`/api/admin/payout-methods/${m.id}/verify`, jsonBody("POST", { verified }))
    setBusy(false)
    if (!res.ok) { setError(res.error); return }
    setError(null); setNotice(verified ? "Payout method marked verified." : "Payout method marked unverified.")
    await load()
  }

  return (
    <OfficeDashboardLayout>
      <div className="space-y-4">
        <Link href={`/merchants/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />{name ? `${name} review page` : "Merchant review page"}
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">{name ? `${name}: money` : "Merchant money"}</h1>
          <p className="text-sm text-muted-foreground">Balances, earnings, payouts and payout methods. Amounts are per currency and never converted.</p>
        </div>

        <NoticeBanner message={notice} />
        <ErrorBanner message={error} />
        {!d && !error && <p className="text-sm text-muted-foreground">Loading...</p>}

        {d && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {d.balances.length === 0 && <Card><CardContent className="py-6 text-sm text-muted-foreground">No earnings yet.</CardContent></Card>}
              {d.balances.map((b) => (
                <Card key={b.currency}>
                  <CardHeader><CardTitle className="text-base">{b.currency}</CardTitle></CardHeader>
                  <CardContent>
                    <dl className="divide-y text-sm">
                      {([
                        ["Pending (in hold)", b.pending],
                        ["Available to pay out", b.available],
                        ["In payout", b.inPayout],
                        ["Paid out", b.paidOut],
                        ["Lifetime net", b.lifetimeNet],
                      ] as const).map(([label, v]) => (
                        <div key={label} className="flex items-center justify-between py-1.5">
                          <dt className="text-muted-foreground">{label}</dt>
                          <dd className="tabular-nums font-medium">{formatMoney(v, b.currency)}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Payout methods</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><Th>Method</Th><Th>Currency</Th><Th>Status</Th>{act && <Th right>Verified</Th>}</TableRow></TableHeader>
                  <TableBody>
                    {d.methods.length === 0 && <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">No payout methods.</TableCell></TableRow>}
                    {d.methods.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{kindLabel(m.kind)}{m.label ? ` • ${m.label}` : ""}{m.last4 ? ` • ****${m.last4}` : ""}{m.is_default && <span className="ml-2 text-xs text-muted-foreground">Default</span>}</TableCell>
                        <TableCell>{m.currency}</TableCell>
                        <TableCell><VerifiedBadge verified={m.verified} /></TableCell>
                        {act && (
                          <TableCell className="text-right">
                            <Switch checked={m.verified} disabled={busy} onCheckedChange={(v) => verify(m, v)} aria-label={`Verified: ${m.label || m.kind}`} />
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {!act && <p className="px-4 pb-3 text-xs text-muted-foreground">Your role can view methods but not verify them.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Earnings</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-card">
                      <TableRow><Th>Order</Th><Th>Fulfilled</Th><Th right>Items</Th><Th right>Delivery</Th><Th right>Ciuna fee</Th><Th right>Net</Th><Th>Status</Th></TableRow>
                    </TableHeader>
                    <TableBody>
                      {d.earnings.length === 0 && <TableRow><TableCell colSpan={7} className="py-6 text-center text-muted-foreground">No earnings yet.</TableCell></TableRow>}
                      {d.earnings.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="font-mono text-xs">{e.marketplace_orders?.public_id || e.order_id.slice(0, 8)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDateTime(e.fulfilled_at)}</TableCell>
                          <Num>{formatMoney(e.subtotal, e.currency)}</Num>
                          <Num>{formatMoney(e.delivery_fee, e.currency)}</Num>
                          <Num>{formatMoney(e.commission, e.currency)}</Num>
                          <Num>{formatMoney(e.net, e.currency)}</Num>
                          <TableCell>
                            <FinanceStatusBadge status={e.status} />
                            {e.status === "pending" && e.release_at && <div className="text-xs text-muted-foreground">Releases {formatDateTime(e.release_at)}</div>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {d.earnings.length >= 100 && <p className="px-4 py-2 text-xs text-muted-foreground">Showing the latest 100 earnings.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Payouts</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><Th>Requested</Th><Th right>Amount</Th><Th right>Fee</Th><Th right>Net</Th><Th>Status</Th><Th>Paid / reference</Th></TableRow></TableHeader>
                  <TableBody>
                    {d.payouts.length === 0 && <TableRow><TableCell colSpan={6} className="py-6 text-center text-muted-foreground">No payouts yet.</TableCell></TableRow>}
                    {d.payouts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm text-muted-foreground">{formatDateTime(p.requested_at)}</TableCell>
                        <Num>{formatMoney(p.amount, p.currency)}</Num>
                        <Num>{formatMoney(p.fee, p.currency)}</Num>
                        <Num>{formatMoney(p.net, p.currency)}</Num>
                        <TableCell><FinanceStatusBadge status={p.status} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.paid_at ? formatDateTime(p.paid_at) : "-"}{p.reference ? ` • ${p.reference}` : ""}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </OfficeDashboardLayout>
  )
}
