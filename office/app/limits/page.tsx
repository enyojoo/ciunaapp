"use client"

import { useCallback, useEffect, useState } from "react"
import { OfficeDashboardLayout } from "@/components/layout/office-dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api, formatDateTime, jsonBody } from "@/components/merchants/merchant-lib"
import { usePermissions } from "@/lib/permissions"

interface Limit { level: number; currency: string; monthly_amount: number; min_per_transfer: number | null; max_per_transfer: number | null; updated_at: string }
interface Draft { currency: string; monthly: string; min: string; max: string }

const LEVELS = [
  { level: 1, name: "Level 1", note: "New accounts, ID not yet checked" },
  { level: 2, name: "Level 2", note: "ID checked" },
  { level: 3, name: "Level 3", note: "Fully verified" },
]
const blank: Draft = { currency: "", monthly: "", min: "", max: "" }

export default function SendLimitsPage() {
  const { can } = usePermissions()
  const canEdit = can("settings.manage")
  const [limits, setLimits] = useState<Limit[]>([])
  const [drafts, setDrafts] = useState<Record<number, Draft>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<number | null>(null)
  const [saved, setSaved] = useState<number | null>(null)

  const load = useCallback(async () => {
    const res = await api<{ limits: Limit[] }>("/api/admin/send-limits")
    if (res.ok) {
      setLimits(res.data.limits)
      const d: Record<number, Draft> = {}
      for (const l of LEVELS) {
        const row = res.data.limits.find((x) => x.level === l.level)
        d[l.level] = row ? { currency: row.currency, monthly: String(row.monthly_amount), min: row.min_per_transfer == null ? "" : String(row.min_per_transfer), max: row.max_per_transfer == null ? "" : String(row.max_per_transfer) } : blank
      }
      setDrafts(d)
      setError(null)
    } else setError(res.error)
    setLoading(false)
  }, [])
  useEffect(() => { void load() }, [load])

  const set = (level: number, k: keyof Draft, v: string) => { setSaved(null); setDrafts((d) => ({ ...d, [level]: { ...(d[level] || blank), [k]: v } })) }

  const save = async (level: number) => {
    const d = drafts[level] || blank
    setBusy(level); setError(null)
    const res = await api("/api/admin/send-limits", jsonBody("PUT", { level, currency: d.currency.trim(), monthlyAmount: d.monthly.trim(), minPerTransfer: d.min.trim(), maxPerTransfer: d.max.trim() }))
    setBusy(null)
    if (res.ok) { setSaved(level); await load() } else setError(res.error)
  }
  const remove = async (level: number) => {
    setBusy(level); setError(null)
    const res = await api("/api/admin/send-limits", jsonBody("PUT", { level, remove: true }))
    setBusy(null)
    if (res.ok) { setSaved(null); await load() } else setError(res.error)
  }

  const anySet = limits.length > 0

  return (
    <OfficeDashboardLayout>
      <div className="mx-auto w-full max-w-3xl space-y-4 p-4">
        <div>
          <h1 className="text-2xl font-semibold">Send limits</h1>
          <p className="text-sm text-muted-foreground">How much a customer can send in a calendar month (UTC), by verification level. A limit applies to transfers sent in its own currency. A level with no limit is not capped.</p>
        </div>
        {!loading && !anySet ? <Card className="p-4 text-sm">No limits are set, so sending is not capped. Enter the amounts compliance has approved below.</Card> : null}
        {error ? <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div> : null}
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : LEVELS.map(({ level, name, note }) => {
          const d = drafts[level] || blank
          const row = limits.find((x) => x.level === level)
          return (
            <Card key={level} className="space-y-3 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <div><h2 className="font-medium">{name}</h2><p className="text-xs text-muted-foreground">{note}</p></div>
                <span className="text-xs text-muted-foreground">{row ? `Updated ${formatDateTime(row.updated_at)}` : "No limit set"}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <label className="text-xs">Currency<Input value={d.currency} maxLength={3} placeholder="RUB" disabled={!canEdit} onChange={(e) => set(level, "currency", e.target.value.toUpperCase())} /></label>
                <label className="text-xs">Per month<Input value={d.monthly} inputMode="decimal" placeholder="50000" disabled={!canEdit} onChange={(e) => set(level, "monthly", e.target.value)} /></label>
                <label className="text-xs">Min per transfer<Input value={d.min} inputMode="decimal" placeholder="optional" disabled={!canEdit} onChange={(e) => set(level, "min", e.target.value)} /></label>
                <label className="text-xs">Max per transfer<Input value={d.max} inputMode="decimal" placeholder="optional" disabled={!canEdit} onChange={(e) => set(level, "max", e.target.value)} /></label>
              </div>
              {canEdit ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" disabled={busy === level || !d.currency || !d.monthly} onClick={() => void save(level)}>{busy === level ? "Saving…" : "Save"}</Button>
                  {row ? <Button size="sm" variant="outline" disabled={busy === level} onClick={() => void remove(level)}>Remove limit</Button> : null}
                  {saved === level ? <span className="text-xs text-success-text">Saved</span> : null}
                </div>
              ) : <p className="text-xs text-muted-foreground">You can view limits but not change them.</p>}
            </Card>
          )
        })}
      </div>
    </OfficeDashboardLayout>
  )
}
