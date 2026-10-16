"use client"

import { useCallback, useEffect, useState } from "react"
import { Search } from "lucide-react"
import { OfficeDashboardLayout } from "@/components/layout/office-dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DecisionDialog } from "@/components/merchants/decision-dialog"
import { api, formatDate, jsonBody } from "@/components/merchants/merchant-lib"
import { RatingStars } from "@/components/reviews/rating-stars"
import { ReviewStatusBadge } from "@/components/reviews/review-status-badge"
import { HIDE_REASONS, excerpt, type OfficeReview } from "@/components/reviews/review-lib"
import { usePermissions } from "@/lib/permissions"

const PAGE = 50
const TABS = [
  { value: "published", label: "Published" },
  { value: "hidden", label: "Hidden" },
  { value: "all", label: "All" },
]

export default function ReviewsPage() {
  const { can } = usePermissions()
  const canModerate = can("merchants.review")
  const [tab, setTab] = useState("published")
  const [rating, setRating] = useState("all")
  const [search, setSearch] = useState("")
  const [q, setQ] = useState("")
  const [offset, setOffset] = useState(0)
  const [rows, setRows] = useState<OfficeReview[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [hiding, setHiding] = useState<OfficeReview | null>(null)
  const [busy, setBusy] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => { setQ(search.trim()); setOffset(0) }, 300)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const p = new URLSearchParams({ limit: String(PAGE), offset: String(offset) })
    if (tab !== "all") p.set("status", tab)
    if (rating !== "all") p.set("rating", rating)
    if (q) p.set("q", q)
    const res = await api<{ reviews: OfficeReview[]; total: number }>(`/api/admin/reviews?${p}`)
    if (res.ok) { setRows(res.data.reviews); setTotal(res.data.total) } else setError(res.error)
    setLoading(false)
  }, [tab, rating, q, offset])

  useEffect(() => { load() }, [load])

  async function moderate(review: OfficeReview, action: "hide" | "unhide", reason?: string) {
    setBusy(true)
    setDialogError(null)
    setNotice(null)
    const res = await api(`/api/admin/reviews/${review.id}`, jsonBody("PATCH", { action, reason }))
    setBusy(false)
    if (!res.ok) {
      if (action === "hide") setDialogError(res.error)
      else setError(res.error)
      return
    }
    setHiding(null)
    setNotice(action === "hide" ? "Review hidden. It no longer counts toward the rating." : "Review is published again.")
    load()
  }

  return (
    <OfficeDashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Reviews</h1>
          <p className="text-sm text-muted-foreground">Customer ratings of stores and experts. Hidden reviews drop out of the rating straight away.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={tab} onValueChange={(v) => { setTab(v); setOffset(0) }}>
            <TabsList>
              {TABS.map((t) => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
            </TabsList>
          </Tabs>
          <Select value={rating} onValueChange={(v) => { setRating(v); setOffset(0) }}>
            <SelectTrigger className="w-36" aria-label="Rating"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ratings</SelectItem>
              {[5, 4, 3, 2, 1].map((n) => <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "star" : "stars"}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by merchant" aria-label="Search by merchant" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {notice && <p className="rounded-md bg-success-surface px-3 py-2 text-sm text-success-text" role="status">{notice}</p>}
        {error && <p className="rounded-md bg-destructive-surface px-3 py-2 text-sm text-destructive-text" role="alert">{error}</p>}

        <Card className="overflow-hidden">
          <div className="max-h-[calc(100vh-18rem)] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reply</TableHead>
                  {canModerate && <TableHead className="text-right">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && rows.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Loading...</TableCell></TableRow>
                )}
                {!loading && rows.length === 0 && !error && (
                  <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">No reviews match.</TableCell></TableRow>
                )}
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.merchant?.name ?? "-"}</div>
                      <div className="text-xs capitalize text-muted-foreground">{r.target_type === "expert" ? "Expert" : "Store"}</div>
                    </TableCell>
                    <TableCell><RatingStars value={r.rating} /></TableCell>
                    <TableCell className="max-w-xs text-sm">
                      {r.body ? <span title={r.body}>{excerpt(r.body)}</span> : <span className="text-muted-foreground">No text</span>}
                      {r.status === "hidden" && r.hidden_reason ? <div className="mt-0.5 text-xs text-muted-foreground">Hidden: {r.hidden_reason}</div> : null}
                    </TableCell>
                    <TableCell className="text-sm">{r.customer ?? "-"}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDate(r.created_at)}</TableCell>
                    <TableCell><ReviewStatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-sm">{r.has_reply ? "Replied" : <span className="text-muted-foreground">-</span>}</TableCell>
                    {canModerate && (
                      <TableCell className="text-right">
                        {r.status === "published" ? (
                          <Button variant="outline" size="sm" onClick={() => { setDialogError(null); setHiding(r) }}>Hide</Button>
                        ) : (
                          <Button variant="outline" size="sm" disabled={busy} onClick={() => moderate(r, "unhide")}>Unhide</Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total === 0 ? "0 reviews" : `${offset + 1}-${Math.min(offset + PAGE, total)} of ${total}`}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - PAGE))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={offset + PAGE >= total || loading} onClick={() => setOffset(offset + PAGE)}>Next</Button>
          </div>
        </div>
      </div>

      <DecisionDialog
        open={Boolean(hiding)}
        onOpenChange={(o) => { if (!o) setHiding(null) }}
        title="Hide this review"
        description="Hidden reviews no longer show to customers or count toward the rating. The reason is kept in the audit log."
        confirmLabel="Hide review"
        destructive
        minLength={3}
        templates={HIDE_REASONS}
        busy={busy}
        error={dialogError}
        onConfirm={(reason) => hiding && moderate(hiding, "hide", reason)}
      />
    </OfficeDashboardLayout>
  )
}
