"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { OfficeDashboardLayout } from "@/components/layout/office-dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RequirementsEditor, validateRequirements, type KybRequirements } from "@/components/merchants/requirements-editor"
import { MerchantStatusBadge } from "@/components/merchants/merchant-status-badge"
import { api, jsonBody } from "@/components/merchants/merchant-lib"
import { usePermissions } from "@/lib/permissions"

interface Profile {
  id: string
  country: string
  merchant_type: string
  tier: number
  label: string
  requirements: KybRequirements
  sanctions_check: boolean
  active: boolean
}

interface Draft {
  country: string
  merchant_type: string
  tier: string
  label: string
  requirements: KybRequirements
  sanctions_check: boolean
  active: boolean
}

const EMPTY: Draft = {
  country: "", merchant_type: "*", tier: "1", label: "",
  requirements: { fields: [], documents: [] }, sanctions_check: true, active: true,
}

export default function KybPage() {
  const { can } = usePermissions()
  const editable = can("kyb.manage")
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await api<{ profiles: Profile[] }>("/api/admin/kyb-profiles")
    if (res.ok) { setProfiles(res.data.profiles); setError(null) } else setError(res.error)
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const groups = useMemo(() => {
    const m = new Map<string, Profile[]>()
    profiles.forEach((p) => m.set(p.country, [...(m.get(p.country) || []), p]))
    return Array.from(m.entries()).sort(([a], [b]) => (a === "*" ? -1 : b === "*" ? 1 : a.localeCompare(b)))
  }, [profiles])

  const openEdit = (p: Profile) => {
    setIsNew(false); setFormError(null)
    setDraft({
      country: p.country, merchant_type: p.merchant_type, tier: String(p.tier), label: p.label,
      requirements: { fields: p.requirements?.fields || [], documents: p.requirements?.documents || [] },
      sanctions_check: p.sanctions_check, active: p.active,
    })
  }

  const save = async () => {
    if (!draft) return
    const country = draft.country.trim().toUpperCase()
    const invalid = validateRequirements(country, draft.requirements)
    if (invalid) { setFormError(invalid); return }
    setSaving(true); setFormError(null)
    const res = await api("/api/admin/kyb-profiles", jsonBody("PUT", {
      country, merchant_type: draft.merchant_type, tier: Number(draft.tier), label: draft.label.trim(),
      requirements: draft.requirements, sanctions_check: draft.sanctions_check, active: draft.active,
    }))
    setSaving(false)
    if (!res.ok) { setFormError(res.error); return }
    setDraft(null)
    setNotice(`Saved ${country} tier ${draft.tier}.`)
    load()
  }

  return (
    <OfficeDashboardLayout>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">KYB requirements</h1>
            <p className="text-sm text-muted-foreground">
              What a merchant must provide, by country, type and tier. A country of * is the fallback.
              {!editable && " You have read-only access."}
            </p>
          </div>
          {editable && (
            <Button className="bg-primary text-primary-foreground" onClick={() => { setIsNew(true); setFormError(null); setDraft(EMPTY) }}>
              <Plus className="mr-1 h-4 w-4" />New profile
            </Button>
          )}
        </div>

        {notice && <p className="rounded-md bg-success-surface px-3 py-2 text-sm text-success-text" role="status">{notice}</p>}
        {error && <p className="rounded-md bg-destructive-surface px-3 py-2 text-sm text-destructive-text" role="alert">{error}</p>}
        {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {!loading && !error && groups.length === 0 && <p className="text-sm text-muted-foreground">No KYB profiles yet.</p>}

        {groups.map(([country, list]) => (
          <Card key={country} className="overflow-hidden">
            <div className="border-b px-4 py-2 text-sm font-semibold">{country === "*" ? "All other countries (*)" : country}</div>
            <ul className="divide-y">
              {list.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => openEdit(p)} className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-accent/50">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{p.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.requirements?.fields?.length || 0} fields {"•"} {p.requirements?.documents?.length || 0} documents
                        {p.sanctions_check ? " • sanctions check" : ""}
                      </div>
                    </div>
                    <span className="text-xs capitalize text-muted-foreground">{p.merchant_type === "*" ? "All types" : p.merchant_type}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">Tier {p.tier}</span>
                    <MerchantStatusBadge status={p.active ? "live" : "paused"} className="min-w-14 justify-center" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Dialog open={!!draft} onOpenChange={(o) => { if (!o) setDraft(null) }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{isNew ? "New KYB profile" : editable ? "Edit KYB profile" : "KYB profile"}</DialogTitle>
            <DialogDescription>Saving replaces the profile for this country, type and tier.</DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Country</label>
                  <Input value={draft.country} maxLength={2} placeholder="* or RU" disabled={!editable || !isNew} onChange={(e) => setDraft({ ...draft, country: e.target.value.toUpperCase() })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Type</label>
                  <Select value={draft.merchant_type} disabled={!editable || !isNew} onValueChange={(v) => setDraft({ ...draft, merchant_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="*">All types</SelectItem>
                      <SelectItem value="store">Store</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Tier</label>
                  <Select value={draft.tier} disabled={!editable || !isNew} onValueChange={(v) => setDraft({ ...draft, tier: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Tier 1 (individual)</SelectItem>
                      <SelectItem value="2">Tier 2 (registered business)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Label</label>
                  <Input value={draft.label} disabled={!editable} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-6 text-sm">
                <label className="flex items-center gap-2"><Checkbox checked={draft.sanctions_check} disabled={!editable} onCheckedChange={(c) => setDraft({ ...draft, sanctions_check: c === true })} />Sanctions check</label>
                <label className="flex items-center gap-2"><Checkbox checked={draft.active} disabled={!editable} onCheckedChange={(c) => setDraft({ ...draft, active: c === true })} />Active</label>
              </div>
              <RequirementsEditor value={draft.requirements} readOnly={!editable} onChange={(requirements) => setDraft({ ...draft, requirements })} />
              {formError && <p className="text-sm text-destructive-text" role="alert">{formError}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>{editable ? "Cancel" : "Close"}</Button>
            {editable && <Button className="bg-primary text-primary-foreground" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save profile"}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OfficeDashboardLayout>
  )
}
