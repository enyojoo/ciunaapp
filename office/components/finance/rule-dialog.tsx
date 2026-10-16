"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ErrorBanner, MerchantSearch, type MerchantHit } from "./finance-ui"
import { CATEGORIES, CURRENCIES, FEE_NOT_RETROACTIVE, SERVICE_LINES, fapi, jsonBody } from "./finance-lib"
import type { RuleRow } from "./fee-types"

interface Form {
  scope: string; service_line: string; category: string; merchant: MerchantHit | null
  percent: string; fixed_amount: string; currency: string; min_fee: string; max_fee: string; waive_above: string
  active: boolean; starts_at: string; ends_at: string; note: string
}

const toDateInput = (iso: string | null) => {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
const fromDateInput = (v: string) => (v ? new Date(`${v}T00:00:00`).toISOString() : null)
const s = (v: unknown) => (v === null || v === undefined ? "" : String(v))

function blank(kind: "commission" | "payout"): Form {
  return { scope: "platform", service_line: "food", category: "", merchant: null, percent: "", fixed_amount: "", currency: "RUB", min_fee: "", max_fee: "", waive_above: "", active: true, starts_at: "", ends_at: "", note: "" }
}

function fromRule(r: RuleRow): Form {
  return {
    scope: r.scope, service_line: r.service_line || "food", category: r.category || "",
    merchant: r.merchant_id ? { id: r.merchant_id, display_name: r.merchants?.display_name || "Merchant", country: "" } : null,
    percent: s(r.percent), fixed_amount: s(r.fixed_amount), currency: r.currency || "RUB", min_fee: s(r.min_fee), max_fee: s(r.max_fee),
    waive_above: s(r.waive_above), active: r.active, starts_at: toDateInput(r.starts_at), ends_at: toDateInput(r.ends_at), note: r.note || "",
  }
}

const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v))

/** Mirrors the API checks so mistakes show before saving. Returns an error message or null. */
export function validateRule(kind: "commission" | "payout", f: Form): string | null {
  const pct = numOrNull(f.percent), fixed = numOrNull(f.fixed_amount)
  const min = numOrNull(f.min_fee), max = numOrNull(f.max_fee), waive = numOrNull(f.waive_above)
  for (const [label, v] of [["Percent", pct], ["Fixed amount", fixed], ["Minimum", min], ["Maximum", max], ["Waive above", waive]] as const) {
    if (v !== null && (!Number.isFinite(v) || v < 0)) return `${label} must be zero or more.`
  }
  if (pct === null && fixed === null) return "Enter a percent, a fixed amount, or both."
  if (pct !== null && pct > 100) return "Percent cannot be more than 100."
  if (fixed !== null && !f.currency) return "A fixed amount needs a currency."
  if ((min !== null || max !== null) && !f.currency) return "Minimum and maximum need a currency."
  if (min !== null && max !== null && min > max) return "Minimum cannot be above maximum."
  if ((f.scope === "service_line" || f.scope === "category") && !f.service_line) return "Choose a service line."
  if (f.scope === "category" && !f.category) return "Choose a category."
  if (f.scope === "merchant" && !f.merchant) return "Choose a merchant."
  if (f.starts_at && f.ends_at && f.ends_at <= f.starts_at) return "The end date must be after the start date."
  return null
}

export function RuleDialog({ open, kind, rule, onOpenChange, onSaved }: {
  open: boolean; kind: "commission" | "payout"; rule: RuleRow | null
  onOpenChange: (o: boolean) => void; onSaved: (msg: string) => void
}) {
  const [f, setF] = useState<Form>(blank(kind))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { if (open) { setF(rule ? fromRule(rule) : blank(kind)); setError(null) } }, [open, rule, kind])

  const set = (p: Partial<Form>) => setF((x) => ({ ...x, ...p }))
  const scopes = kind === "payout"
    ? [{ v: "platform", l: "Platform (everyone)" }, { v: "merchant", l: "One merchant" }]
    : [{ v: "platform", l: "Platform (everyone)" }, { v: "service_line", l: "Service line" }, { v: "category", l: "Category" }, { v: "merchant", l: "One merchant" }]
  const lines = f.scope === "category" ? SERVICE_LINES.filter((l) => CATEGORIES[l.value].length > 0) : SERVICE_LINES
  const problem = validateRule(kind, f)

  const save = async () => {
    if (problem) { setError(problem); return }
    setBusy(true); setError(null)
    const body = {
      id: rule?.id, kind, scope: f.scope,
      service_line: f.scope === "service_line" || f.scope === "category" ? f.service_line : null,
      category: f.scope === "category" ? f.category : null,
      merchant_id: f.scope === "merchant" ? f.merchant?.id : null,
      percent: numOrNull(f.percent), fixed_amount: numOrNull(f.fixed_amount),
      currency: f.currency || null, min_fee: numOrNull(f.min_fee), max_fee: numOrNull(f.max_fee),
      waive_above: kind === "payout" ? numOrNull(f.waive_above) : null,
      active: f.active, starts_at: fromDateInput(f.starts_at), ends_at: fromDateInput(f.ends_at), note: f.note.trim() || null,
    }
    const res = await fapi("/api/admin/fee-rules", jsonBody("PUT", body))
    setBusy(false)
    if (!res.ok) { setError(res.error); return }
    onOpenChange(false)
    onSaved(rule ? "Rule updated." : "Rule created.")
  }

  const field = (label: string, node: React.ReactNode, hint?: string) => (
    <div className="space-y-1.5"><Label>{label}</Label>{node}{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>
  )
  const numInput = (key: keyof Form, ph?: string) => (
    <Input inputMode="decimal" className="tabular-nums" placeholder={ph} value={f[key] as string} onChange={(e) => set({ [key]: e.target.value } as Partial<Form>)} />
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{rule ? "Edit" : "New"} {kind === "payout" ? "payout fee rule" : "commission rule"}</DialogTitle>
          <DialogDescription>{FEE_NOT_RETROACTIVE}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {field("Applies to", (
            <Select value={f.scope} onValueChange={(v) => set({ scope: v, category: "" })}>
              <SelectTrigger aria-label="Scope"><SelectValue /></SelectTrigger>
              <SelectContent>{scopes.map((x) => <SelectItem key={x.v} value={x.v}>{x.l}</SelectItem>)}</SelectContent>
            </Select>
          ))}

          {(f.scope === "service_line" || f.scope === "category") && field("Service line", (
            <Select value={f.service_line} onValueChange={(v) => set({ service_line: v, category: "" })}>
              <SelectTrigger aria-label="Service line"><SelectValue /></SelectTrigger>
              <SelectContent>{lines.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
            </Select>
          ))}
          {f.scope === "category" && field("Category", (
            <Select value={f.category} onValueChange={(v) => set({ category: v })}>
              <SelectTrigger aria-label="Category"><SelectValue placeholder="Choose a category" /></SelectTrigger>
              <SelectContent>{(CATEGORIES[f.service_line] || []).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          ))}
          {f.scope === "merchant" && field("Merchant", <MerchantSearch value={f.merchant} onChange={(m) => set({ merchant: m })} />)}

          <div className="grid grid-cols-2 gap-3">
            {field("Percent (%)", numInput("percent", "8"))}
            {field("Fixed amount", numInput("fixed_amount", "0"), "Only applies in its currency.")}
          </div>
          {field("Currency", (
            <Select value={f.currency} onValueChange={(v) => set({ currency: v })}>
              <SelectTrigger aria-label="Currency"><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          ), "Used by the fixed amount, minimum, maximum and waive-above values. A percent-only rule applies in every currency.")}
          <div className="grid grid-cols-2 gap-3">
            {field("Minimum fee", numInput("min_fee"))}
            {field("Maximum fee", numInput("max_fee"))}
          </div>
          {kind === "payout" && field("Waive above", numInput("waive_above"), "Payouts at or above this amount have no fee.")}

          <div className="grid grid-cols-2 gap-3">
            {field("Starts", <Input type="date" value={f.starts_at} onChange={(e) => set({ starts_at: e.target.value })} />)}
            {field("Ends", <Input type="date" value={f.ends_at} onChange={(e) => set({ ends_at: e.target.value })} />)}
          </div>
          {field("Note", <Input maxLength={300} value={f.note} onChange={(e) => set({ note: e.target.value })} placeholder="Why this rule exists" />)}
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={f.active} onCheckedChange={(v) => set({ active: v })} aria-label="Active" /> Active
          </label>
        </div>

        <ErrorBanner message={error} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button className="bg-primary text-primary-foreground" disabled={busy || !!problem} onClick={save}>{busy ? "Saving..." : "Save rule"}</Button>
        </DialogFooter>
        {problem && <p className="-mt-2 text-right text-xs text-muted-foreground">{problem}</p>}
      </DialogContent>
    </Dialog>
  )
}
