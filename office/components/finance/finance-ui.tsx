"use client"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { fapi } from "./finance-lib"

const PAYOUT_STATUS: Record<string, { label: string; cls: string }> = {
  requested: { label: "Requested", cls: "bg-warning-surface text-warning-text" },
  approved: { label: "Approved", cls: "bg-neutral-surface text-neutral-text" },
  paid: { label: "Paid", cls: "bg-success-surface text-success-text" },
  rejected: { label: "Rejected", cls: "bg-destructive-surface text-destructive-text" },
  cancelled: { label: "Cancelled", cls: "bg-neutral-surface text-neutral-text" },
  pending: { label: "Pending", cls: "bg-warning-surface text-warning-text" },
  available: { label: "Available", cls: "bg-success-surface text-success-text" },
  reversed: { label: "Reversed", cls: "bg-destructive-surface text-destructive-text" },
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", className)}>{children}</span>
}

export function FinanceStatusBadge({ status }: { status: string }) {
  const m = PAYOUT_STATUS[status] || { label: status.replace(/_/g, " "), cls: "bg-neutral-surface text-neutral-text" }
  return <Pill className={m.cls}>{m.label}</Pill>
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified
    ? <Pill className="bg-success-surface text-success-text">Verified</Pill>
    : <Pill className="bg-warning-surface text-warning-text">Unverified</Pill>
}

export function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null
  return <p className="rounded-md bg-destructive-surface px-3 py-2 text-sm text-destructive-text" role="alert">{message}</p>
}

export function NoticeBanner({ message }: { message?: string | null }) {
  if (!message) return null
  return <p className="rounded-md bg-success-surface px-3 py-2 text-sm text-success-text" role="status">{message}</p>
}

export function Money({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("tabular-nums", className)}>{children}</span>
}

export function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 break-words">{children || "-"}</dd>
    </div>
  )
}

export interface MerchantHit { id: string; display_name: string; country: string; type?: string; fee_plan_id?: string | null }

/** Search merchants by name (GET /api/admin/merchants?q=) and pick one. */
export function MerchantSearch({
  value, onChange, placeholder = "Search merchants by name",
}: { value: MerchantHit | null; onChange: (m: MerchantHit | null) => void; placeholder?: string }) {
  const [text, setText] = useState("")
  const [hits, setHits] = useState<MerchantHit[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    const q = text.trim()
    if (q.length < 2) { setHits([]); setSearched(false); return }
    let stale = false
    const t = setTimeout(async () => {
      setLoading(true)
      const res = await fapi<{ merchants: MerchantHit[] }>(`/api/admin/merchants?${new URLSearchParams({ q, limit: "8" })}`)
      if (stale) return
      setLoading(false)
      setSearched(true)
      setHits(res.ok ? res.data.merchants : [])
    }, 300)
    return () => { stale = true; clearTimeout(t) }
  }, [text])

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
        <span><span className="font-medium">{value.display_name}</span> <span className="text-muted-foreground">{value.country}</span></span>
        <button type="button" className="text-xs text-primary-text hover:underline" onClick={() => { onChange(null); setText("") }}>Change</button>
      </div>
    )
  }
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input className="pl-9" placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} aria-label="Search merchants" />
      {text.trim().length >= 2 && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover shadow-md">
          {loading && <p className="px-3 py-2 text-sm text-muted-foreground">Searching...</p>}
          {!loading && searched && hits.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">No merchants match.</p>}
          {hits.map((m) => (
            <button
              key={m.id}
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => { onChange(m); setText(""); setHits([]) }}
            >
              <span>{m.display_name}</span>
              <span className="text-xs text-muted-foreground">{m.country}{m.type ? ` • ${m.type}` : ""}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
