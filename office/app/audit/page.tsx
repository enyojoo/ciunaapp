"use client"

import { Fragment, useCallback, useEffect, useState } from "react"
import { ChevronRight, Download } from "lucide-react"
import { OfficeDashboardLayout } from "@/components/layout/office-dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api, formatDateTime } from "@/components/merchants/merchant-lib"
import { EntityPicker, type Option } from "@/components/office/entity-picker"
import { SavedViews, type ViewFilters } from "@/components/office/saved-views"
import { officeFetch } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { ROLE_LABELS } from "@/lib/office-nav"

const PAGE = 50

interface Entry {
  id: number
  actor_kind: string
  actor_id: string | null
  actor_role: string | null
  actor_name?: string | null
  actor_email?: string | null
  merchant_id: string | null
  merchant_name?: string | null
  action: string
  entity_type: string
  entity_id: string | null
  details: Record<string, unknown>
  created_at: string
}

const FILTERS = [
  { key: "entity_type", label: "Entity type" },
  { key: "action", label: "Action" },
  { key: "entity_id", label: "Entity ID" },
] as const

type Picked = { actor: Option | null; merchant: Option | null }

export default function AuditPage() {
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [picked, setPicked] = useState<Picked>({ actor: null, merchant: null })
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [exporting, setExporting] = useState(false)
  const [applied, setApplied] = useState<Record<string, string>>({})
  const [offset, setOffset] = useState(0)
  const [entries, setEntries] = useState<Entry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const p = new URLSearchParams({ limit: String(PAGE), offset: String(offset) })
    Object.entries(applied).forEach(([k, v]) => { if (v) p.set(k, v) })
    const res = await api<{ entries: Entry[]; total: number }>(`/api/admin/audit?${p}`)
    if (res.ok) { setEntries(res.data.entries); setTotal(res.data.total) } else setError(res.error)
    setLoading(false)
  }, [applied, offset])

  useEffect(() => { load() }, [load])

  const filtersNow = (): Record<string, string> => {
    const next: Record<string, string> = {}
    Object.entries(draft).forEach(([k, v]) => { if (v.trim()) next[k] = v.trim() })
    if (picked.actor) next.actor_id = picked.actor.id
    if (picked.merchant) next.merchant_id = picked.merchant.id
    if (from) next.from = from
    if (to) next.to = to
    return next
  }
  const apply = () => { setOffset(0); setApplied(filtersNow()) }
  const clear = () => { setDraft({}); setPicked({ actor: null, merchant: null }); setFrom(""); setTo(""); setApplied({}); setOffset(0) }

  // saved views keep ids with their names so the pickers show names again
  const current = (): ViewFilters => ({ ...filtersNow(), actor_name: picked.actor?.label ?? "", merchant_name: picked.merchant?.label ?? "" })
  const applyView = (f: ViewFilters) => {
    const str = (k: string) => (typeof f[k] === "string" ? (f[k] as string) : "")
    const next: Record<string, string> = {}
    for (const k of ["entity_type", "action", "entity_id", "actor_id", "merchant_id", "from", "to"]) if (str(k)) next[k] = str(k)
    setDraft(Object.fromEntries(FILTERS.filter((x) => next[x.key]).map((x) => [x.key, next[x.key]])))
    setPicked({
      actor: next.actor_id ? { id: next.actor_id, label: str("actor_name") || next.actor_id.slice(0, 8) } : null,
      merchant: next.merchant_id ? { id: next.merchant_id, label: str("merchant_name") || next.merchant_id.slice(0, 8) } : null,
    })
    setFrom(next.from || ""); setTo(next.to || "")
    setOffset(0); setApplied(next)
  }

  const searchActors = async (q: string): Promise<Option[]> => {
    const r = await api<{ actors: Array<{ id: string; name: string | null; email: string; role: string }> }>(`/api/admin/audit/actors?q=${encodeURIComponent(q)}`)
    return r.ok ? r.data.actors.map((a) => ({ id: a.id, label: a.name || a.email, sub: a.name ? `${a.email} · ${ROLE_LABELS[a.role] ?? a.role}` : ROLE_LABELS[a.role] ?? a.role })) : []
  }
  const searchMerchants = async (q: string): Promise<Option[]> => {
    const r = await api<{ merchants: Array<{ id: string; name: string; type: string }> }>(`/api/admin/audit/actors?q=${encodeURIComponent(q)}`)
    return r.ok ? r.data.merchants.map((m) => ({ id: m.id, label: m.name, sub: m.type })) : []
  }

  const exportCsv = async () => {
    setExporting(true); setError(null)
    try {
      const p = new URLSearchParams()
      Object.entries(applied).forEach(([k, v]) => { if (v) p.set(k, v) })
      const res = await officeFetch(`/api/admin/audit/export?${p}`)
      if (!res.ok) { setError(res.status === 403 ? "Your role can't export the audit log." : "Export failed. Try again."); return }
      const url = URL.createObjectURL(await res.blob())
      const a = document.createElement("a")
      a.href = url; a.download = `audit-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
    } catch { setError("Export failed. Try again.") } finally { setExporting(false) }
  }

  return (
    <OfficeDashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Audit log</h1>
          <p className="text-sm text-muted-foreground">Append-only record of admin, merchant and system actions.</p>
        </div>

        <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); apply() }}>
          <EntityPicker label="Actor" value={picked.actor} onChange={(actor) => setPicked({ ...picked, actor })} search={searchActors} placeholder="Name or email" />
          <EntityPicker label="Merchant" value={picked.merchant} onChange={(merchant) => setPicked({ ...picked, merchant })} search={searchMerchants} placeholder="Business name" />
          {FILTERS.map((f) => (
            <div key={f.key} className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor={`f-${f.key}`}>{f.label}</label>
              <Input id={`f-${f.key}`} className="w-40" value={draft[f.key] || ""} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
            </div>
          ))}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="f-from">From</label>
            <Input id="f-from" type="date" className="w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="f-to">To</label>
            <Input id="f-to" type="date" className="w-40" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button type="submit" className="bg-primary text-primary-foreground">Apply</Button>
          <Button type="button" variant="outline" onClick={clear}>Clear</Button>
          <SavedViews scope="audit" current={current()} onApply={applyView} />
          <Button type="button" variant="outline" disabled={exporting} onClick={exportCsv}><Download className="mr-1.5 h-4 w-4" aria-hidden />{exporting ? "Exporting..." : "Export CSV"}</Button>
        </form>

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-md bg-destructive-surface px-3 py-2 text-sm text-destructive-text" role="alert">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={load}>Try again</Button>
          </div>
        )}

        <Card className="overflow-hidden">
          <div className="max-h-[calc(100vh-18rem)] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Merchant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && entries.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Loading...</TableCell></TableRow>}
                {!loading && entries.length === 0 && !error && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">{Object.keys(applied).length ? "No entries match these filters." : "Nothing has been recorded yet."}</TableCell></TableRow>}
                {entries.map((e) => (
                  <Fragment key={e.id}>
                    <TableRow className="cursor-pointer" onClick={() => setOpen(open === e.id ? null : e.id)}>
                      <TableCell><ChevronRight className={cn("h-4 w-4 transition-transform", open === e.id && "rotate-90")} /></TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{formatDateTime(e.created_at)}</TableCell>
                      <TableCell className="text-sm">
                        <span className="capitalize">{e.actor_kind}</span>{e.actor_role ? <span className="ml-1.5 inline-flex items-center rounded-full bg-primary-tint px-2 py-0.5 text-xs font-medium text-primary-text">{ROLE_LABELS[e.actor_role] ?? e.actor_role}</span> : null}
                        {e.actor_name || e.actor_email ? (
                          <div className="font-medium">{e.actor_name || e.actor_email}{e.actor_name && e.actor_email ? <span className="block text-xs font-normal text-muted-foreground">{e.actor_email}</span> : null}</div>
                        ) : e.actor_id ? <div className="font-mono text-xs text-muted-foreground">{e.actor_id.slice(0, 8)}</div> : null}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{e.action}</TableCell>
                      <TableCell className="text-sm">{e.entity_type}{e.entity_id && <div className="font-mono text-xs text-muted-foreground">{e.entity_id.slice(0, 8)}</div>}</TableCell>
                      <TableCell className="text-sm">{e.merchant_name ?? (e.merchant_id ? <span className="font-mono text-xs">{e.merchant_id.slice(0, 8)}</span> : "-")}</TableCell>
                    </TableRow>
                    {open === e.id && (
                      <TableRow>
                        <TableCell />
                        <TableCell colSpan={5}>
                          <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(e.details, null, 2)}</pre>
                          <p className="mt-1 font-mono text-xs text-muted-foreground">
                            entry {e.id}{e.merchant_id ? ` • merchant ${e.merchant_id}` : ""}{e.actor_id ? ` • actor ${e.actor_id}` : ""}{e.entity_id ? ` • entity ${e.entity_id}` : ""}
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total === 0 ? "0 entries" : `${offset + 1}-${Math.min(offset + PAGE, total)} of ${total}`}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - PAGE))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={offset + PAGE >= total || loading} onClick={() => setOffset(offset + PAGE)}>Next</Button>
          </div>
        </div>
      </div>
    </OfficeDashboardLayout>
  )
}
