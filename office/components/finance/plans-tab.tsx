"use client"

import { useEffect, useState } from "react"
import { Pencil, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ErrorBanner, MerchantSearch, Pill, type MerchantHit } from "./finance-ui"
import { CURRENCIES, fapi, formatMoney, jsonBody } from "./finance-lib"
import type { PlanRow } from "./fee-types"

function PlanDialog({ open, plan, onOpenChange, onSaved }: { open: boolean; plan: PlanRow | null; onOpenChange: (o: boolean) => void; onSaved: (m: string) => void }) {
  const [name, setName] = useState("")
  const [pct, setPct] = useState("")
  const [monthly, setMonthly] = useState("0")
  const [currency, setCurrency] = useState("RUB")
  const [active, setActive] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!open) return
    setName(plan?.name || ""); setPct(plan?.commission_percent != null ? String(plan.commission_percent) : "")
    setMonthly(plan ? String(plan.monthly_fee) : "0"); setCurrency(plan?.currency || "RUB"); setActive(plan?.active ?? true); setError(null)
  }, [open, plan])

  const p = pct.trim() === "" ? null : Number(pct)
  const m = Number(monthly || 0)
  const problem =
    name.trim().length < 2 ? "Enter a plan name (at least 2 characters)."
    : p !== null && (!Number.isFinite(p) || p < 0 || p > 100) ? "Percent must be between 0 and 100."
    : !Number.isFinite(m) || m < 0 ? "Monthly fee must be zero or more."
    : null

  const save = async () => {
    if (problem) { setError(problem); return }
    setBusy(true); setError(null)
    const res = await fapi("/api/admin/fee-plans", jsonBody("PUT", { id: plan?.id, name: name.trim(), commission_percent: p, monthly_fee: m, currency, active }))
    setBusy(false)
    if (!res.ok) { setError(res.error); return }
    onOpenChange(false); onSaved(plan ? "Plan updated." : "Plan created.")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{plan ? "Edit plan" : "New plan"}</DialogTitle>
          <DialogDescription>A plan sets a commission percent for the merchants assigned to it. A merchant-specific rule still overrides it.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="plan-name">Name</Label><Input id="plan-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="plan-pct">Commission (%)</Label><Input id="plan-pct" inputMode="decimal" className="tabular-nums" value={pct} onChange={(e) => setPct(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="plan-fee">Monthly fee</Label><Input id="plan-fee" inputMode="decimal" className="tabular-nums" value={monthly} onChange={(e) => setMonthly(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Monthly fee currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger aria-label="Currency"><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">Subscription billing is not built yet. The monthly fee is recorded but not charged.</p>
          <label className="flex items-center gap-2 text-sm"><Switch checked={active} onCheckedChange={setActive} aria-label="Active" /> Active (inactive plans are ignored when computing fees)</label>
        </div>
        <ErrorBanner message={error} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button className="bg-primary text-primary-foreground" disabled={busy || !!problem} onClick={save}>{busy ? "Saving..." : "Save plan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Searches a merchant, shows its current plan, and assigns one with PATCH merchants/{id}. */
function AssignPlan({ plans, onNotice, onError }: { plans: PlanRow[]; onNotice: (m: string) => void; onError: (m: string | null) => void }) {
  const [merchant, setMerchant] = useState<MerchantHit | null>(null)
  const [planId, setPlanId] = useState("none")
  const [current, setCurrent] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!merchant) { setCurrent(null); setPlanId("none"); return }
    let stale = false
    fapi<{ merchant: { fee_plan_id?: string | null } }>(`/api/admin/merchants/${merchant.id}`).then((r) => {
      if (stale || !r.ok) return
      const cur = r.data.merchant.fee_plan_id || null
      setCurrent(cur); setPlanId(cur || "none")
    })
    return () => { stale = true }
  }, [merchant])

  const assign = async () => {
    if (!merchant) return
    setBusy(true); onError(null)
    const res = await fapi(`/api/admin/merchants/${merchant.id}`, jsonBody("PATCH", { fee_plan_id: planId === "none" ? null : planId }))
    setBusy(false)
    if (!res.ok) { onError(res.error); return }
    setCurrent(planId === "none" ? null : planId)
    onNotice(planId === "none" ? `${merchant.display_name} no longer has a plan.` : `Plan assigned to ${merchant.display_name}.`)
  }

  const currentName = current ? plans.find((p) => p.id === current)?.name || "Unknown plan" : "No plan"
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Assign plan to merchant</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <MerchantSearch value={merchant} onChange={setMerchant} />
        {merchant && (
          <>
            <p className="text-sm text-muted-foreground">Current plan: <span className="text-foreground">{currentName}</span></p>
            <div className="flex gap-2">
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger aria-label="Plan"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No plan</SelectItem>
                  {plans.filter((p) => p.active || p.id === current).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" disabled={busy || planId === (current || "none")} onClick={assign}>{busy ? "Saving..." : "Assign"}</Button>
            </div>
            <p className="text-xs text-muted-foreground">Applies to orders accepted from now on.</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function PlansTab({ plans, onChanged, onError, onNotice }: { plans: PlanRow[]; onChanged: () => void; onError: (m: string | null) => void; onNotice: (m: string) => void }) {
  const [editing, setEditing] = useState<PlanRow | null>(null)
  const [open, setOpen] = useState(false)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">Fee plans bundle a commission percent. Assign one to a merchant below. Plans rank below a merchant-specific rule and above category, service line and platform rules.</p>
        <Button className="bg-primary text-primary-foreground" onClick={() => { setEditing(null); setOpen(true) }}><Plus className="mr-1 h-4 w-4" />New plan</Button>
      </div>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead className="text-right">Monthly fee</TableHead>
              <TableHead>Subscription billing</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No plans yet.</TableCell></TableRow>}
            {plans.map((p) => (
              <TableRow key={p.id} className={p.active ? undefined : "opacity-60"}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-right tabular-nums">{p.commission_percent !== null ? `${Number(p.commission_percent)}%` : "-"}</TableCell>
                <TableCell className="text-right tabular-nums">{Number(p.monthly_fee) > 0 ? formatMoney(p.monthly_fee, p.currency) : "-"}</TableCell>
                <TableCell><Pill className="bg-neutral-surface text-neutral-text">Not billed yet</Pill></TableCell>
                <TableCell>{p.active ? <Pill className="bg-success-surface text-success-text">Active</Pill> : <Pill className="bg-neutral-surface text-neutral-text">Inactive</Pill>}</TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="icon" aria-label="Edit plan" onClick={() => { setEditing(p); setOpen(true) }}><Pencil className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <div className="max-w-xl"><AssignPlan plans={plans} onNotice={onNotice} onError={onError} /></div>
      <PlanDialog open={open} plan={editing} onOpenChange={setOpen} onSaved={(m) => { onNotice(m); onChanged() }} />
    </div>
  )
}
