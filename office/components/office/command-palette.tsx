"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Package, Search, Wallet } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { api } from "@/components/merchants/merchant-lib"
import { cn } from "@/lib/utils"

interface Hit { kind: "merchant" | "order" | "payout"; id: string; title: string; subtitle: string; href: string }
const ICON = { merchant: Building2, order: Package, payout: Wallet } as const
const GROUP = { merchant: "Merchants", order: "Orders", payout: "Payouts" } as const

/** Opens with Cmd/Ctrl-K. Searches merchants, orders and payouts by id or name; results are limited to what the role may read. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [hits, setHits] = useState<Hit[]>([])
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [active, setActive] = useState(0)
  const seq = useRef(0)

  useEffect(() => { if (open) { setQ(""); setHits([]); setActive(0); setFailed(false) } }, [open])

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) { setHits([]); setLoading(false); setFailed(false); return }
    const id = ++seq.current
    setLoading(true)
    const t = setTimeout(async () => {
      const r = await api<{ results: Hit[] }>(`/api/admin/search?q=${encodeURIComponent(term)}`)
      if (id !== seq.current) return
      setLoading(false)
      setFailed(!r.ok)
      setHits(r.ok ? r.data.results : [])
      setActive(0)
    }, 200)
    return () => clearTimeout(t)
  }, [q])

  const go = useCallback((h: Hit) => { onOpenChange(false); router.push(h.href) }, [onOpenChange, router])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, Math.max(hits.length - 1, 0))) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === "Enter" && hits[active]) { e.preventDefault(); go(hits[active]) }
  }

  const kinds = (Object.keys(GROUP) as Array<keyof typeof GROUP>).filter((k) => hits.some((h) => h.kind === k))
  const ordered = kinds.flatMap((k) => hits.filter((h) => h.kind === k))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[20%] translate-y-0 gap-0 p-0 sm:max-w-xl" data-testid="command-palette">
        <DialogTitle className="sr-only">Search Office</DialogTitle>
        <DialogDescription className="sr-only">Find merchants, orders and payouts by name or id.</DialogDescription>
        <div className="flex items-center gap-2 border-b px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            role="combobox"
            aria-expanded={ordered.length > 0}
            aria-controls="office-search-results"
            aria-label="Search merchants, orders and payouts"
            placeholder="Search merchants, orders, payouts"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div id="office-search-results" role="listbox" className="max-h-80 overflow-y-auto p-2">
          {q.trim().length < 2 ? <p className="px-3 py-6 text-center text-sm text-muted-foreground">Type at least 2 characters.</p> : null}
          {q.trim().length >= 2 && loading && ordered.length === 0 ? <p className="px-3 py-6 text-center text-sm text-muted-foreground">Searching...</p> : null}
          {q.trim().length >= 2 && !loading && failed ? <p className="px-3 py-6 text-center text-sm text-destructive-text">Search is not available right now. Try again.</p> : null}
          {q.trim().length >= 2 && !loading && !failed && ordered.length === 0 ? <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nothing found.</p> : null}
          {kinds.map((k) => (
            <div key={k} role="group" aria-label={GROUP[k]}>
              <div className="px-3 pb-1 pt-2 text-xs font-medium text-muted-foreground">{GROUP[k]}</div>
              {hits.filter((h) => h.kind === k).map((h) => {
                const Icon = ICON[h.kind]
                const idx = ordered.indexOf(h)
                return (
                  <button
                    key={`${h.kind}-${h.id}`}
                    type="button"
                    role="option"
                    aria-selected={idx === active}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => go(h)}
                    className={cn("flex w-full items-center gap-3 rounded-md px-3 py-2 text-left", idx === active ? "bg-accent text-accent-foreground" : "")}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{h.title}</span>
                      <span className="block truncate text-xs capitalize text-muted-foreground">{h.subtitle}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
