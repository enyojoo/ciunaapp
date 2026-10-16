"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { OfficeDashboardLayout } from "@/components/layout/office-dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MerchantStatusBadge } from "@/components/merchants/merchant-status-badge"
import { RelativeAge } from "@/components/merchants/relative-age"
import { api, type MerchantRow } from "@/components/merchants/merchant-lib"
import { OwnerCell } from "@/components/office/owner-cell"
import { SlaChip } from "@/components/office/sla-chip"
import { SavedViews, type ViewFilters } from "@/components/office/saved-views"
import { usePermissions } from "@/lib/permissions"
import { refreshQueues } from "@/lib/office-queues"

const PAGE = 50
const TABS = [
  { value: "in_review", label: "In review" },
  { value: "live", label: "Live" },
  { value: "paused", label: "Paused" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
  { value: "all", label: "All" },
]

export default function MerchantsPage() {
  const router = useRouter()
  const [tab, setTab] = useState("in_review")
  const [type, setType] = useState("all")
  const [search, setSearch] = useState("")
  const [q, setQ] = useState("")
  const [offset, setOffset] = useState(0)
  const [rows, setRows] = useState<MerchantRow[]>([])
  const [total, setTotal] = useState(0)
  const [reviewCount, setReviewCount] = useState<number | null>(null)
  const [mine, setMine] = useState(false)
  const [overSla, setOverSla] = useState(false)
  const { can } = usePermissions()
  const canClaim = can("merchants.review")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => { setQ(search.trim()); setOffset(0) }, 300)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const p = new URLSearchParams({ limit: String(PAGE), offset: String(offset) })
    if (tab !== "all") p.set("status", tab)
    if (type !== "all") p.set("type", type)
    if (q) p.set("q", q)
    if (mine) p.set("mine", "1")
    if (overSla) p.set("over_sla", "1")
    const res = await api<{ merchants: MerchantRow[]; total: number }>(`/api/admin/merchants?${p}`)
    if (res.ok) {
      setRows(res.data.merchants)
      setTotal(res.data.total)
      if (tab === "in_review" && !q && type === "all" && !mine && !overSla) setReviewCount(res.data.total)
    } else setError(res.error)
    setLoading(false)
  }, [tab, type, q, offset, mine, overSla])

  useEffect(() => { load() }, [load])

  // keep the in-review count available on other tabs
  useEffect(() => {
    if (tab === "in_review") return
    api<{ total: number }>("/api/admin/merchants?status=in_review&limit=1").then((r) => { if (r.ok) setReviewCount(r.data.total) })
  }, [tab])

  const changed = () => { void load(); void refreshQueues() }
  const current: ViewFilters = { tab, type: type === "all" ? "" : type, q, mine, over_sla: overSla }
  const applyView = (f: ViewFilters) => {
    setTab(String(f.tab || "in_review")); setType(String(f.type || "all")); setSearch(String(f.q || "")); setQ(String(f.q || ""))
    setMine(f.mine === true); setOverSla(f.over_sla === true); setOffset(0)
  }

  return (
    <OfficeDashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Merchants</h1>
          <p className="text-sm text-muted-foreground">Review applications and manage store and expert merchants.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={tab} onValueChange={(v) => { setTab(v); setOffset(0) }}>
            <TabsList>
              {TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}{t.value === "in_review" && reviewCount !== null ? ` (${reviewCount})` : ""}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Select value={type} onValueChange={(v) => { setType(v); setOffset(0) }}>
            <SelectTrigger className="w-32" aria-label="Type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="store">Store</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>
          <Button variant={mine ? "default" : "outline"} size="sm" aria-pressed={mine} onClick={() => { setMine(!mine); setOffset(0) }}>Mine</Button>
          <Button variant={overSla ? "default" : "outline"} size="sm" aria-pressed={overSla} onClick={() => { setOverSla(!overSla); setOffset(0) }}>Over SLA</Button>
          <SavedViews scope="merchants" current={current} onApply={applyView} />
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

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
                  <TableHead>Business</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && rows.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Loading...</TableCell></TableRow>
                )}
                {!loading && rows.length === 0 && !error && (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    {q || type !== "all" || mine || overSla
                      ? "No merchants match these filters."
                      : tab === "in_review"
                        ? "Nothing is waiting for review. New applications appear here."
                        : "No merchants in this tab yet."}
                  </TableCell></TableRow>
                )}
                {rows.map((m) => (
                  <TableRow
                    key={m.id}
                    tabIndex={0}
                    className="cursor-pointer"
                    onClick={() => router.push(`/merchants/${m.id}`)}
                    onKeyDown={(e) => { if (e.key === "Enter") router.push(`/merchants/${m.id}`) }}
                  >
                    <TableCell>
                      <div className="font-medium">{m.display_name}</div>
                      <div className="text-xs capitalize text-muted-foreground">{m.type}</div>
                    </TableCell>
                    <TableCell className="text-sm">{m.country} {"→"} {m.operating_country}</TableCell>
                    <TableCell><MerchantStatusBadge status={m.status} /></TableCell>
                    <TableCell className="tabular-nums">{m.kyb_tier ? `Tier ${m.kyb_tier}` : "-"}</TableCell>
                    <TableCell><RelativeAge iso={m.submitted_at ?? m.created_at} warn={m.status === "in_review"} /></TableCell>
                    <TableCell>{m.status === "in_review" ? <SlaChip sla={m.sla} /> : <span className="text-muted-foreground">-</span>}</TableCell>
                    <TableCell>
                      {m.status === "in_review"
                        ? <OwnerCell owner={m.owner ?? null} claimUrl={`/api/admin/merchants/${m.id}/claim`} canClaim={canClaim} onChanged={changed} onError={setError} />
                        : m.office_managed ? <span className="rounded-full bg-neutral-surface px-2 py-0.5 text-xs text-neutral-text">Office-managed</span> : m.owner_team ? <span className="text-xs capitalize text-muted-foreground">{m.owner_team}</span> : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total === 0 ? "0 merchants" : `${offset + 1}-${Math.min(offset + PAGE, total)} of ${total}`}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - PAGE))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={offset + PAGE >= total || loading} onClick={() => setOffset(offset + PAGE)}>Next</Button>
          </div>
        </div>
      </div>
    </OfficeDashboardLayout>
  )
}
