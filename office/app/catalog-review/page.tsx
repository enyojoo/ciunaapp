"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Search } from "lucide-react"
import { OfficeDashboardLayout } from "@/components/layout/office-dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MerchantStatusBadge } from "@/components/merchants/merchant-status-badge"
import { RelativeAge } from "@/components/merchants/relative-age"
import { api, jsonBody, type ApiResult } from "@/components/merchants/merchant-lib"
import { formatMoney } from "@/components/finance/finance-lib"
import { OwnerCell, ownerLabel, type Owner } from "@/components/office/owner-cell"
import { SlaChip, type Sla } from "@/components/office/sla-chip"
import { SavedViews, type ViewFilters } from "@/components/office/saved-views"
import { usePermissions } from "@/lib/permissions"
import { refreshQueues } from "@/lib/office-queues"
import { cn } from "@/lib/utils"

const PAGE = 50
const TABS = [
  { value: "pending", label: "Needs review" },
  { value: "live", label: "Live" },
  { value: "rejected", label: "Rejected" },
  { value: "paused", label: "Paused" },
  { value: "all", label: "All" },
]

interface Listing {
  id: string
  title: string
  short_description: string | null
  long_description?: string | null
  category: string | null
  status: string
  review_status: "approved" | "pending" | "rejected"
  review_note: string | null
  fixed_amount: number | null
  fixed_currency: string | null
  sale_price: number | null
  list_price: number | null
  image_url: string | null
  gallery?: string[] | null
  service_line_slug: string
  hub_vendors?: { name: string } | null
  merchants?: { display_name: string } | null
  waiting_since: string | null
  sla: Sla | null
  owner: Owner | null
}
interface Reason { key: string; label: string; text: string; needs_message?: boolean }

const statusOf = (l: Listing) => (l.review_status === "pending" ? "in_review" : l.review_status === "rejected" ? "rejected" : l.status)
const sellerOf = (l: Listing) => l.merchants?.display_name || l.hub_vendors?.name || "Seller"
const priceOf = (l: Listing) => formatMoney(l.sale_price ?? l.fixed_amount ?? l.list_price, l.fixed_currency)

export default function CatalogReviewPage() {
  const { can } = usePermissions()
  const canReview = can("listings.review")
  const [tab, setTab] = useState("pending")
  const [line, setLine] = useState("all")
  const [search, setSearch] = useState("")
  const [q, setQ] = useState("")
  const [mine, setMine] = useState(false)
  const [overSla, setOverSla] = useState(false)
  const [offset, setOffset] = useState(0)
  const [rows, setRows] = useState<Listing[]>([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState<Record<string, number | null>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviewId, setReviewId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => { setQ(search.trim()); setOffset(0) }, 300)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    const p = new URLSearchParams({ tab, limit: String(PAGE), offset: String(offset) })
    if (line !== "all") p.set("line", line)
    if (q) p.set("q", q)
    if (mine) p.set("mine", "1")
    if (overSla) p.set("over_sla", "1")
    const r = await api<{ listings: Listing[]; total: number; counts: Record<string, number | null> }>(`/api/admin/listings?${p}`)
    if (r.ok) { setRows(r.data.listings); setTotal(r.data.total); setCounts(r.data.counts) } else setError(r.error)
    setLoading(false)
  }, [tab, line, q, offset, mine, overSla])
  useEffect(() => { void load() }, [load])

  const changed = () => { void load(); void refreshQueues() }
  const filtered = !!q || line !== "all" || mine || overSla
  const current: ViewFilters = { tab, line: line === "all" ? "" : line, q, mine, over_sla: overSla }
  const applyView = (f: ViewFilters) => {
    setTab(String(f.tab || "pending")); setLine(String(f.line || "all")); setSearch(String(f.q || "")); setQ(String(f.q || ""))
    setMine(f.mine === true); setOverSla(f.over_sla === true); setOffset(0)
  }

  return (
    <OfficeDashboardLayout>
      <div className="space-y-4 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Catalog review</h1>
          <p className="text-sm text-muted-foreground">Approve or reject new and edited listings from Food and Mart sellers. Oldest first.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={tab} onValueChange={(v) => { setTab(v); setOffset(0) }}>
            <TabsList>
              {TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}{typeof counts[t.value] === "number" ? ` (${counts[t.value]})` : ""}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Select value={line} onValueChange={(v) => { setLine(v); setOffset(0) }}>
            <SelectTrigger className="w-32" aria-label="Line"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All lines</SelectItem>
              <SelectItem value="food">Food</SelectItem>
              <SelectItem value="mart">Mart</SelectItem>
            </SelectContent>
          </Select>
          <Button variant={mine ? "default" : "outline"} size="sm" aria-pressed={mine} onClick={() => { setMine(!mine); setOffset(0) }}>Mine</Button>
          <Button variant={overSla ? "default" : "outline"} size="sm" aria-pressed={overSla} onClick={() => { setOverSla(!overSla); setOffset(0) }}>Over SLA</Button>
          <SavedViews scope="listings" current={current} onApply={applyView} />
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
                  <TableHead className="w-14" />
                  <TableHead>Listing</TableHead>
                  <TableHead>Line</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Waiting</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Next</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && rows.length === 0 && <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">Loading...</TableCell></TableRow>}
                {!loading && rows.length === 0 && !error && (
                  <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    {filtered ? (
                      "No listings match these filters."
                    ) : tab === "pending" ? (
                      <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" aria-hidden />All clear. New and edited listings appear here for review.</span>
                    ) : "No listings in this tab yet."}
                  </TableCell></TableRow>
                )}
                {rows.map((l) => (
                  <TableRow key={l.id} tabIndex={0} className="cursor-pointer" onClick={() => setReviewId(l.id)} onKeyDown={(e) => { if (e.key === "Enter") setReviewId(l.id) }}>
                    <TableCell>
                      {l.image_url ? <img src={l.image_url} alt="" className="h-10 w-10 rounded-md object-cover" /> : <div className="h-10 w-10 rounded-md bg-neutral-surface" aria-hidden />}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{l.title}</div>
                      <div className="text-xs text-muted-foreground">{sellerOf(l)}{l.category ? ` · ${l.category}` : ""}</div>
                    </TableCell>
                    <TableCell className="text-sm capitalize">{l.service_line_slug}</TableCell>
                    <TableCell className="text-right tabular-nums">{priceOf(l)}</TableCell>
                    <TableCell><MerchantStatusBadge status={statusOf(l)} /></TableCell>
                    <TableCell>{l.review_status === "pending" ? <RelativeAge iso={l.waiting_since} warn limitHours={l.sla?.limit_hours ?? 12} /> : <span className="text-muted-foreground">-</span>}</TableCell>
                    <TableCell>{l.review_status === "pending" ? <SlaChip sla={l.sla} /> : <span className="text-muted-foreground">-</span>}</TableCell>
                    <TableCell>
                      {l.review_status === "pending"
                        ? <OwnerCell owner={l.owner} claimUrl={`/api/admin/listings/${l.id}/claim`} canClaim={canReview} onChanged={changed} onError={setError} />
                        : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant={l.review_status === "pending" ? "default" : "outline"} className={l.review_status === "pending" ? "bg-primary text-primary-foreground" : undefined}
                        onClick={(e) => { e.stopPropagation(); setReviewId(l.id) }}>
                        {l.review_status === "pending" ? "Review" : "Open"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total === 0 ? "0 listings" : `${offset + 1}-${Math.min(offset + PAGE, total)} of ${total}`}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - PAGE))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={offset + PAGE >= total || loading} onClick={() => setOffset(offset + PAGE)}>Next</Button>
          </div>
        </div>
      </div>

      <ReviewDialog id={reviewId} canReview={canReview} onClose={() => setReviewId(null)} onChanged={changed} />
    </OfficeDashboardLayout>
  )
}

function ReviewDialog({ id, canReview, onClose, onChanged }: { id: string | null; canReview: boolean; onClose: () => void; onChanged: () => void }) {
  const [listing, setListing] = useState<Listing | null>(null)
  const [reasons, setReasons] = useState<Reason[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [key, setKey] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photo, setPhoto] = useState(0)

  const load = useCallback(async () => {
    if (!id) return
    setLoadError(null)
    const r = await api<{ listing: Listing }>(`/api/admin/listings/${id}`)
    if (r.ok) setListing(r.data.listing); else setLoadError(r.error)
  }, [id])

  useEffect(() => {
    setListing(null); setKey(""); setMessage(""); setError(null); setPhoto(0)
    void load()
  }, [id, load])
  useEffect(() => {
    if (!id || reasons.length) return
    api<{ reasons: Reason[] }>("/api/admin/listings/reasons").then((r) => { if (r.ok) setReasons(r.data.reasons) })
  }, [id, reasons.length])

  const reason = reasons.find((r) => r.key === key)
  const pending = listing?.review_status === "pending"
  const heldByOther = !!listing?.owner && !listing.owner.mine
  const rejectReady = !!reason && (!reason.needs_message || message.trim().length >= 5)

  const decide = async (action: "approve" | "reject") => {
    if (!id) return
    setBusy(true); setError(null)
    const r: ApiResult<unknown> = await api(`/api/admin/listings/${id}/decision`, jsonBody("POST", action === "approve" ? { action } : { action, template_key: key, message: message.trim() }))
    setBusy(false)
    if (!r.ok) {
      setError(r.code === "CLAIMED_BY_OTHER" ? "Another reviewer has claimed this listing." : r.error)
      void load()
      return
    }
    onChanged(); onClose()
  }

  const photos = listing ? [listing.image_url, ...(Array.isArray(listing.gallery) ? listing.gallery : [])].filter((x): x is string => !!x) : []

  return (
    <Dialog open={!!id} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{listing?.title ?? "Listing"}</DialogTitle>
          <DialogDescription>{listing ? `${sellerOf(listing)} · ${listing.service_line_slug}` : "Loading the listing."}</DialogDescription>
        </DialogHeader>

        {loadError ? (
          <div className="flex items-center justify-between gap-3 rounded-md bg-destructive-surface px-3 py-2 text-sm text-destructive-text" role="alert">
            <span>{loadError}</span><Button variant="outline" size="sm" onClick={load}>Try again</Button>
          </div>
        ) : !listing ? <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p> : (
          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
            <div className="space-y-4">
              {photos.length ? (
                <div className="space-y-2">
                  <img src={photos[photo] ?? photos[0]} alt={`${listing.title}, photo ${photo + 1}`} className="max-h-72 w-full rounded-md border object-contain" />
                  {photos.length > 1 ? (
                    <div className="flex gap-2 overflow-x-auto">
                      {photos.map((p, i) => (
                        <button key={p + i} type="button" aria-label={`Photo ${i + 1}`} aria-pressed={i === photo} onClick={() => setPhoto(i)} className={cn("h-14 w-14 shrink-0 overflow-hidden rounded-md border", i === photo && "ring-2 ring-primary")}>
                          <img src={p} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : <p className="rounded-md bg-warning-surface px-3 py-2 text-sm text-warning-text">This listing has no photos.</p>}
              <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Price</dt><dd className="tabular-nums">{priceOf(listing)}</dd>
                <dt className="text-muted-foreground">Category</dt><dd>{listing.category || "-"}</dd>
                <dt className="text-muted-foreground">Status</dt><dd className="flex items-center gap-2"><MerchantStatusBadge status={statusOf(listing)} />{pending ? <SlaChip sla={listing.sla} /> : null}</dd>
                <dt className="text-muted-foreground">Owner</dt><dd>{ownerLabel(listing.owner)}</dd>
                <dt className="text-muted-foreground">Description</dt>
                <dd className="whitespace-pre-wrap">{listing.long_description || listing.short_description || "-"}</dd>
                {listing.review_note ? (<><dt className="text-muted-foreground">Seller sees</dt><dd className="whitespace-pre-wrap">{listing.review_note}</dd></>) : null}
              </dl>
              <Link href={`/products/${listing.id}/edit`} className="inline-block text-sm text-primary-text hover:underline">Edit this listing</Link>
            </div>

            <div className="space-y-3">
              {!pending ? (
                <p className="text-sm text-muted-foreground">This listing is not in review. Only listings waiting for review can be decided here.</p>
              ) : !canReview ? (
                <p className="text-sm text-muted-foreground">Your role can view this listing but not decide on it.</p>
              ) : (
                <>
                  {heldByOther ? <p className="rounded-md bg-warning-surface px-3 py-2 text-sm text-warning-text">Claimed by {ownerLabel(listing.owner)}. Deciding now takes it over only if you are a super admin.</p> : null}
                  <div>
                    <p className="mb-2 text-sm font-medium">Reason (needed to reject)</p>
                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Rejection reason">
                      {reasons.map((r) => (
                        <button key={r.key} type="button" role="radio" aria-checked={key === r.key} onClick={() => setKey(r.key)}
                          className={cn("rounded-full border px-3 py-1 text-left text-xs hover:bg-accent hover:text-accent-foreground", key === r.key ? "border-primary bg-primary-tint text-primary-text" : "text-muted-foreground")}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {reason && !reason.needs_message ? <p className="rounded-md bg-neutral-surface px-3 py-2 text-xs text-neutral-text">The seller sees: {reason.text}</p> : null}
                  <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={1000} placeholder={reason?.needs_message ? "Message to the seller (required)" : "Optional message, added after the reason"} aria-label="Message to the seller" />
                  {error ? <p className="text-sm text-destructive-text" role="alert">{error}</p> : null}
                </>
              )}
            </div>
          </div>
        )}

        {listing && pending && canReview ? (
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={onClose} disabled={busy}>Close</Button>
            <div className="flex gap-2">
              <Button variant="destructive" disabled={busy || !rejectReady} onClick={() => decide("reject")}>{busy ? "Saving..." : "Reject"}</Button>
              <Button className="bg-primary text-primary-foreground" disabled={busy} onClick={() => decide("approve")}>{busy ? "Saving..." : "Approve"}</Button>
            </div>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
