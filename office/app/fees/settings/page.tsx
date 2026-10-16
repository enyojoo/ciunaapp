"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { OfficeDashboardLayout } from "@/components/layout/office-dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ErrorBanner, NoticeBanner } from "@/components/finance/finance-ui"
import { CURRENCIES, fapi, jsonBody } from "@/components/finance/finance-lib"

interface Settings { payout_hold_days?: number; min_payout?: Record<string, number> }
type MinRow = { currency: string; value: string }

export default function MarketplaceSettingsPage() {
  const [hold, setHold] = useState("2")
  const [mins, setMins] = useState<MinRow[]>([])
  const [forbidden, setForbidden] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [newCur, setNewCur] = useState("")

  const load = useCallback(async () => {
    const res = await fapi<{ settings: Settings }>("/api/admin/marketplace-settings")
    if (res.ok) {
      const s = res.data.settings
      setHold(String(s.payout_hold_days ?? 2))
      setMins(Object.entries(s.min_payout || {}).map(([currency, v]) => ({ currency, value: String(v) })))
      setError(null)
    } else if (res.code === "FORBIDDEN") setForbidden(true)
    else setError(res.error)
    setLoaded(true)
  }, [])
  useEffect(() => { load() }, [load])

  const days = Number(hold)
  const holdBad = hold.trim() === "" || !Number.isInteger(days) || days < 0 || days > 60
  const minBad = mins.some((m) => m.value.trim() === "" || !Number.isFinite(Number(m.value)) || Number(m.value) < 0)
  const available = CURRENCIES.filter((c) => !mins.some((m) => m.currency === c))

  const save = async () => {
    setBusy(true); setError(null); setNotice(null)
    const res = await fapi("/api/admin/marketplace-settings", jsonBody("PUT", {
      payout_hold_days: days,
      min_payout: Object.fromEntries(mins.map((m) => [m.currency, Number(m.value)])),
    }))
    setBusy(false)
    if (!res.ok) { setError(res.error); return }
    setNotice("Settings saved.")
    await load()
  }

  return (
    <OfficeDashboardLayout>
      <div className="max-w-3xl space-y-4">
        <Link href="/fees" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />Fees and commissions
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Marketplace money settings</h1>
          <p className="text-sm text-muted-foreground">Rules that apply to every merchant's earnings and payouts.</p>
        </div>

        {forbidden ? (
          <p className="rounded-md bg-muted px-4 py-6 text-sm text-muted-foreground" role="alert">
            These settings can only be viewed and changed by a super admin. Your role doesn't have access.
          </p>
        ) : !loaded ? <p className="text-sm text-muted-foreground">Loading...</p> : (
          <>
            <NoticeBanner message={notice} />
            <ErrorBanner message={error} />

            <Card>
              <CardHeader><CardTitle className="text-base">Payout hold</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  How many days an earning stays pending after the order is fulfilled before it becomes available to pay out. The hold covers refunds and disputes. Applies to earnings recorded from now on.
                </p>
                <div className="flex max-w-xs items-center gap-2">
                  <Label htmlFor="hold" className="sr-only">Hold days</Label>
                  <Input id="hold" inputMode="numeric" className="w-24 tabular-nums" value={hold} onChange={(e) => setHold(e.target.value)} aria-invalid={holdBad} />
                  <span className="text-sm text-muted-foreground">days (0 to 60)</span>
                </div>
                {holdBad && <p className="text-xs text-destructive-text">Enter a whole number from 0 to 60.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Minimum payout</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  The smallest amount a merchant can request, per currency. Requests below it are refused. A currency without a row has no minimum.
                </p>
                <Table>
                  <TableHeader><TableRow><TableHead>Currency</TableHead><TableHead className="text-right">Minimum</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
                  <TableBody>
                    {mins.length === 0 && <TableRow><TableCell colSpan={3} className="py-6 text-center text-muted-foreground">No minimums set.</TableCell></TableRow>}
                    {mins.map((m, i) => (
                      <TableRow key={m.currency}>
                        <TableCell className="font-medium">{m.currency}</TableCell>
                        <TableCell className="text-right">
                          <Input inputMode="decimal" className="ml-auto w-36 text-right tabular-nums" aria-label={`Minimum payout in ${m.currency}`} value={m.value}
                            onChange={(e) => setMins(mins.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                        </TableCell>
                        <TableCell><Button variant="ghost" size="icon" aria-label={`Remove ${m.currency}`} onClick={() => setMins(mins.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {available.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Select value={newCur} onValueChange={setNewCur}>
                      <SelectTrigger className="w-32" aria-label="Currency to add"><SelectValue placeholder="Currency" /></SelectTrigger>
                      <SelectContent>{available.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button variant="outline" disabled={!newCur} onClick={() => { setMins([...mins, { currency: newCur, value: "0" }]); setNewCur("") }}>
                      <Plus className="mr-1 h-4 w-4" />Add currency
                    </Button>
                  </div>
                )}
                {minBad && <p className="text-xs text-destructive-text">Every minimum must be a number, zero or more.</p>}
              </CardContent>
            </Card>

            <Button className="bg-primary text-primary-foreground" disabled={busy || holdBad || minBad} onClick={save}>{busy ? "Saving..." : "Save settings"}</Button>
          </>
        )}
      </div>
    </OfficeDashboardLayout>
  )
}
