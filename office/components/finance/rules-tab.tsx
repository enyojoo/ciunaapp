"use client"

import { Fragment, useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ErrorBanner } from "./finance-ui"
import { FEE_NOT_RETROACTIVE, SERVICE_LINES, fapi, formatDate, formatMoney, jsonBody } from "./finance-lib"
import { RuleDialog } from "./rule-dialog"
import { SCOPE_LABEL, SCOPE_ORDER, ruleToBody, type RuleRow } from "./fee-types"

const lineLabel = (v: string | null) => SERVICE_LINES.find((l) => l.value === v)?.label || v || "-"

function appliesTo(r: RuleRow): string {
  switch (r.scope) {
    case "merchant": return r.merchants?.display_name || "Merchant"
    case "category": return `${lineLabel(r.service_line)} / ${r.category}`
    case "service_line": return lineLabel(r.service_line)
    default: return "Everyone"
  }
}

function window(r: RuleRow): string {
  if (!r.starts_at && !r.ends_at) return "Always"
  return `${r.starts_at ? formatDate(r.starts_at) : "Now"} to ${r.ends_at ? formatDate(r.ends_at) : "no end"}`
}

export function RulesTab({ kind, rules, onChanged, onError, onNotice }: {
  kind: "commission" | "payout"; rules: RuleRow[]; onChanged: () => void; onError: (m: string | null) => void; onNotice: (m: string) => void
}) {
  const [editing, setEditing] = useState<RuleRow | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<RuleRow | null>(null)
  const [busy, setBusy] = useState(false)
  const [delError, setDelError] = useState<string | null>(null)
  const list = rules.filter((r) => r.kind === kind)
  const isPayout = kind === "payout"
  const cols = isPayout ? 9 : 8

  const toggle = async (r: RuleRow, active: boolean) => {
    onError(null)
    const res = await fapi("/api/admin/fee-rules", jsonBody("PUT", ruleToBody(r, { active })))
    if (!res.ok) { onError(res.error); return }
    onChanged()
  }

  const remove = async () => {
    if (!deleting) return
    setBusy(true); setDelError(null)
    const res = await fapi(`/api/admin/fee-rules/${deleting.id}`, { method: "DELETE" })
    setBusy(false)
    if (!res.ok) { setDelError(res.error); return }
    setDeleting(null); onNotice("Rule deleted."); onChanged()
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          {isPayout
            ? "Fees taken from a payout. The most specific active rule wins: merchant, then platform. Newest wins ties. "
            : "Ciuna's commission on item totals (delivery fees are never commissioned). Order of precedence: merchant rule, merchant fee plan, category, service line, platform. Newest wins ties. "}
          {FEE_NOT_RETROACTIVE}
        </p>
        <Button className="bg-primary text-primary-foreground" onClick={() => { setEditing(null); setDialogOpen(true) }}>
          <Plus className="mr-1 h-4 w-4" />New rule
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="max-h-[calc(100vh-22rem)] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>Applies to</TableHead>
                <TableHead className="text-right">Percent</TableHead>
                <TableHead className="text-right">Fixed</TableHead>
                <TableHead className="text-right">Min</TableHead>
                <TableHead className="text-right">Max</TableHead>
                {isPayout && <TableHead className="text-right">Waive above</TableHead>}
                <TableHead>Dates</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 && <TableRow><TableCell colSpan={cols} className="py-10 text-center text-muted-foreground">No rules yet. Without a rule, no fee is charged.</TableCell></TableRow>}
              {SCOPE_ORDER.map((scope) => {
                const group = list.filter((r) => r.scope === scope)
                if (!group.length) return null
                return (
                  <Fragment key={scope}>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableCell colSpan={cols} className="py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{SCOPE_LABEL[scope]}</TableCell>
                    </TableRow>
                    {group.map((r) => {
                      const cur = r.currency || undefined
                      return (
                        <TableRow key={r.id} className={r.active ? undefined : "opacity-60"}>
                          <TableCell>
                            <div className="font-medium">{appliesTo(r)}</div>
                            {r.note && <div className="text-xs text-muted-foreground">{r.note}</div>}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{r.percent !== null && r.percent !== "" ? `${Number(r.percent)}%` : "-"}</TableCell>
                          <TableCell className="text-right tabular-nums">{r.fixed_amount !== null ? formatMoney(r.fixed_amount, cur) : "-"}</TableCell>
                          <TableCell className="text-right tabular-nums">{r.min_fee !== null ? formatMoney(r.min_fee, cur) : "-"}</TableCell>
                          <TableCell className="text-right tabular-nums">{r.max_fee !== null ? formatMoney(r.max_fee, cur) : "-"}</TableCell>
                          {isPayout && <TableCell className="text-right tabular-nums">{r.waive_above !== null ? formatMoney(r.waive_above, cur) : "-"}</TableCell>}
                          <TableCell className="text-sm text-muted-foreground">{window(r)}</TableCell>
                          <TableCell><Switch checked={r.active} onCheckedChange={(v) => toggle(r, v)} aria-label="Active" /></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" aria-label="Edit rule" onClick={() => { setEditing(r); setDialogOpen(true) }}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" aria-label="Delete rule" onClick={() => { setDelError(null); setDeleting(r) }}><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <RuleDialog open={dialogOpen} kind={kind} rule={editing} onOpenChange={setDialogOpen}
        onSaved={(m) => { onNotice(m); onChanged() }} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this rule?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? `${SCOPE_LABEL[deleting.scope]}: ${appliesTo(deleting)}. ` : ""}Future orders will use the next most specific rule. Orders already accepted keep their fee. To pause a rule instead, switch it off.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ErrorBanner message={delError} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); remove() }}>{busy ? "Deleting..." : "Delete rule"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
