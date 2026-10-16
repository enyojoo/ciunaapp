"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DecisionDialog } from "@/components/merchants/decision-dialog"
import { DetailRow, ErrorBanner, FinanceStatusBadge, NoticeBanner, VerifiedBadge } from "./finance-ui"
import { canFinance, fapi, formatDateTime, formatMoney, jsonBody, kindLabel, type PayoutRow } from "./finance-lib"

const REJECT_CHIPS = ["Payout details could not be verified.", "Name on the account doesn't match the business."]

interface Reveal { payout: PayoutRow & { method_id?: string }; verified: boolean; kind?: string; details: Record<string, string> | null }

export const payoutNet = (p: PayoutRow) => {
  const n = Number(p.amount) - Number(p.fee)
  return Number.isFinite(n) ? Math.max(0, Math.round(n * 100) / 100) : Number(p.net)
}

function ReferenceDialog({ open, onOpenChange, busy, error, onConfirm }: {
  open: boolean; onOpenChange: (o: boolean) => void; busy: boolean; error: string | null; onConfirm: (ref: string) => void
}) {
  const [ref, setRef] = useState("")
  useEffect(() => { if (open) setRef("") }, [open])
  const valid = ref.trim().length >= 3
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark as paid</DialogTitle>
          <DialogDescription>Enter the bank or SBP transfer reference. Only confirm after the money has left Ciuna's account.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="payout-ref">Bank or SBP reference</Label>
          <Input id="payout-ref" value={ref} maxLength={120} autoFocus onChange={(e) => setRef(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && valid && !busy) onConfirm(ref.trim()) }} />
        </div>
        <ErrorBanner message={error} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button className="bg-primary text-primary-foreground" disabled={!valid || busy} onClick={() => onConfirm(ref.trim())}>
            {busy ? "Saving..." : "Mark as paid"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Payout detail dialog: amounts, audited reveal of the destination, method verification, decisions. */
export function PayoutPanel({ payout, role, onClose, onChanged }: {
  payout: PayoutRow | null; role: string | null | undefined; onClose: () => void; onChanged: () => void
}) {
  const act = canFinance(role)
  const [reveal, setReveal] = useState<Reveal | null>(null)
  const [revealing, setRevealing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [dialog, setDialog] = useState<"paid" | "reject" | null>(null)

  useEffect(() => { setReveal(null); setError(null); setNotice(null); setDialog(null) }, [payout?.id])

  if (!payout) return null
  const p = payout
  const open = p.status === "requested" || p.status === "approved"

  const showDetails = async () => {
    setRevealing(true); setError(null)
    const res = await fapi<Reveal>(`/api/admin/payouts/${p.id}`)
    setRevealing(false)
    if (res.ok) setReveal(res.data); else setError(res.error)
  }

  const decide = async (body: Record<string, unknown>, success: string, closeAfter: boolean) => {
    setBusy(true); setDialogError(null); setError(null)
    const res = await fapi(`/api/admin/payouts/${p.id}`, jsonBody("POST", body))
    setBusy(false)
    if (!res.ok) { setDialogError(res.error); setError(res.error); return }
    setDialog(null); setNotice(success); onChanged()
    if (closeAfter) onClose()
  }

  const toggleVerified = async (verified: boolean) => {
    const methodId = reveal?.payout?.method_id
    if (!methodId) return
    setBusy(true); setError(null)
    const res = await fapi(`/api/admin/payout-methods/${methodId}/verify`, jsonBody("POST", { verified }))
    setBusy(false)
    if (!res.ok) { setError(res.error); return }
    setReveal({ ...reveal!, verified }); setNotice(verified ? "Payout method marked verified." : "Payout method marked unverified.")
  }

  const snap = p.method_snapshot || {}

  return (
    <>
      <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              Payout <FinanceStatusBadge status={p.status} />
            </DialogTitle>
            <DialogDescription>Requested {formatDateTime(p.requested_at)}</DialogDescription>
          </DialogHeader>

          <NoticeBanner message={notice} />
          <ErrorBanner message={dialog ? null : error} />

          <dl className="divide-y">
            <DetailRow label="Merchant">
              <Link href={`/merchants/${p.merchant_id}`} className="text-primary-text hover:underline">{p.merchants?.display_name || "Merchant"}</Link>
              {p.merchants?.country ? <span className="text-muted-foreground"> • {p.merchants.country}</span> : null}
              {" "}<Link href={`/finance/merchants/${p.merchant_id}`} className="text-xs text-primary-text hover:underline">Money view</Link>
            </DetailRow>
            <DetailRow label="Amount"><span className="tabular-nums">{formatMoney(p.amount, p.currency)}</span></DetailRow>
            <DetailRow label="Payout fee"><span className="tabular-nums">{formatMoney(p.fee, p.currency)}</span></DetailRow>
            <DetailRow label="Net payable"><span className="font-medium tabular-nums">{formatMoney(payoutNet(p), p.currency)}</span></DetailRow>
            <DetailRow label="Method">{kindLabel(snap.kind)}{snap.label ? ` • ${snap.label}` : ""}{snap.last4 ? ` • ****${snap.last4}` : ""}</DetailRow>
            {p.decided_at && <DetailRow label="Decided">{formatDateTime(p.decided_at)}</DetailRow>}
            {p.paid_at && <DetailRow label="Paid">{formatDateTime(p.paid_at)}</DetailRow>}
            {p.reference && <DetailRow label="Reference">{p.reference}</DetailRow>}
            {p.reason && <DetailRow label="Reason">{p.reason}</DetailRow>}
          </dl>

          {act && (
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Payout destination</p>
                  <p className="text-xs text-muted-foreground">Showing the full details is recorded in the audit log with your name.</p>
                </div>
                {!reveal && (
                  <Button variant="outline" size="sm" onClick={showDetails} disabled={revealing}>
                    {revealing ? "Loading..." : "Show payout details"}
                  </Button>
                )}
              </div>
              {reveal && (
                <>
                  {reveal.details ? (
                    <dl className="divide-y rounded-md bg-muted/50 px-3">
                      {Object.entries(reveal.details).map(([k, v]) => (
                        <DetailRow key={k} label={k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())}>
                          <span className="select-all font-mono text-xs">{v}</span>
                        </DetailRow>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-sm text-warning-text">The destination details could not be read. Do not pay this out; ask the merchant to re-add the method.</p>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm">Method <VerifiedBadge verified={reveal.verified} /></div>
                    <label className="flex items-center gap-2 text-sm">
                      Verified
                      <Switch checked={reveal.verified} disabled={busy || !reveal.payout?.method_id} onCheckedChange={toggleVerified} aria-label="Method verified" />
                    </label>
                  </div>
                  {!reveal.verified && (
                    <p className="rounded-md bg-warning-surface px-3 py-2 text-xs text-warning-text">
                      This method is not verified. Check that the account name matches the business before approving or paying.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {act && open && (
            <DialogFooter className="gap-2 sm:justify-between">
              <Button variant="destructive" disabled={busy} onClick={() => { setDialogError(null); setDialog("reject") }}>Reject</Button>
              <div className="flex gap-2">
                {p.status === "requested" && (
                  <Button variant="outline" disabled={busy} onClick={() => decide({ action: "approve" }, "Payout approved.", true)}>Approve</Button>
                )}
                <Button className="bg-primary text-primary-foreground" disabled={busy} onClick={() => { setDialogError(null); setDialog("paid") }}>Mark as paid</Button>
              </div>
            </DialogFooter>
          )}
          {!act && <p className="text-xs text-muted-foreground">Your role can view payouts but not act on them.</p>}
        </DialogContent>
      </Dialog>

      <ReferenceDialog
        open={dialog === "paid"}
        onOpenChange={(o) => { if (!o) setDialog(null) }}
        busy={busy}
        error={dialogError}
        onConfirm={(reference) => decide({ action: "paid", reference }, "Payout marked as paid.", true)}
      />
      <DecisionDialog
        open={dialog === "reject"}
        onOpenChange={(o) => { if (!o) setDialog(null) }}
        title="Reject payout"
        description="The merchant sees this reason exactly as written. The held funds return to their available balance."
        confirmLabel="Reject payout"
        destructive
        minLength={3}
        templates={REJECT_CHIPS}
        busy={busy}
        error={dialogError}
        onConfirm={(reason) => decide({ action: "reject", reason }, "Payout rejected.", true)}
      />
    </>
  )
}
