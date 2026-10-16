"use client"
import { useCallback, useEffect, useState } from "react"
import { Bookmark, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { api, jsonBody } from "@/components/merchants/merchant-lib"

export type ViewFilters = Record<string, string | number | boolean>
interface View { id: string; name: string; filters: ViewFilters }

/**
 * "Views" control: apply, save and delete named filter sets for one screen (merchants, payouts, audit, listings).
 * `current` is what the screen is filtered by now; empty values are dropped when saving.
 */
export function SavedViews({ scope, current, onApply }: { scope: "merchants" | "payouts" | "audit" | "listings"; current: ViewFilters; onApply: (f: ViewFilters) => void }) {
  const [views, setViews] = useState<View[]>([])
  const [unavailable, setUnavailable] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const r = await api<{ views: View[]; unavailable?: boolean }>(`/api/admin/views?scope=${scope}`)
    if (r.ok) { setViews(r.data.views); setUnavailable(!!r.data.unavailable) }
  }, [scope])
  useEffect(() => { void load() }, [load])

  const save = async () => {
    setBusy(true); setError(null)
    const filters = Object.fromEntries(Object.entries(current).filter(([, v]) => v !== "" && v !== false && v !== undefined)) as ViewFilters
    const r = await api("/api/admin/views", jsonBody("POST", { scope, name: name.trim(), filters }))
    setBusy(false)
    if (!r.ok) { setError(r.error); return }
    setSaving(false); setName(""); void load()
  }
  const remove = async (id: string) => { await api(`/api/admin/views/${id}`, { method: "DELETE" }); void load() }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={unavailable} title={unavailable ? "Saved views are not set up on this environment yet" : undefined}>
            <Bookmark className="mr-1.5 h-4 w-4" aria-hidden />Views{views.length ? ` (${views.length})` : ""}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Saved views</DropdownMenuLabel>
          {views.length === 0 ? <div className="px-2 py-1.5 text-sm text-muted-foreground">No saved views yet.</div> : null}
          {views.map((v) => (
            <DropdownMenuItem key={v.id} className="justify-between" onSelect={() => onApply(v.filters)}>
              <span className="truncate">{v.name}</span>
              <button type="button" aria-label={`Delete view ${v.name}`} className="rounded p-1 text-muted-foreground hover:text-destructive-text" onClick={(e) => { e.stopPropagation(); e.preventDefault(); void remove(v.id) }}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => { setError(null); setSaving(true) }}>Save current view...</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saving} onOpenChange={setSaving}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save view</DialogTitle>
            <DialogDescription>Saves the filters you have now. Using an existing name replaces it.</DialogDescription>
          </DialogHeader>
          <Input value={name} maxLength={60} placeholder="View name" autoFocus onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && name.trim() && !busy) void save() }} />
          {error ? <p className="text-sm text-destructive-text" role="alert">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaving(false)} disabled={busy}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground" onClick={save} disabled={!name.trim() || busy}>{busy ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
