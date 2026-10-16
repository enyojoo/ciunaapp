"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { OfficeDashboardLayout } from "@/components/layout/office-dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MerchantStatusBadge } from "@/components/merchants/merchant-status-badge"
import { DocumentRow, type MerchantDocument } from "@/components/merchants/document-row"
import { DecisionDialog } from "@/components/merchants/decision-dialog"
import { RelativeAge } from "@/components/merchants/relative-age"
import { api, canDecide, canManage, formatDateTime, jsonBody, type MerchantRow } from "@/components/merchants/merchant-lib"
import type { KybRequirements } from "@/components/merchants/requirements-editor"
import { useAuth } from "@/lib/auth-context"

interface Detail {
  merchant: MerchantRow
  members: { user_id: string; role: string; users?: { email?: string; first_name?: string; last_name?: string } | null }[]
  applications: { id: string; status: string; answers: any; submitted_at: string; reviewed_at?: string | null; decision_reason?: string | null }[]
  documents: MerchantDocument[]
  kyb: { label?: string; requirements: KybRequirements } | null
  audit: { id: number; actor_kind: string; actor_id: string | null; actor_role: string | null; action: string; details: Record<string, any>; created_at: string }[]
}

type Pending =
  | { kind: "decision"; action: "reject" | "request_changes" | "suspend" }
  | { kind: "document"; docId: string }
  | null

const DIALOG_COPY = {
  reject: { title: "Reject application", confirm: "Reject", destructive: true },
  request_changes: { title: "Request changes", confirm: "Request changes", destructive: false },
  suspend: { title: "Suspend merchant", confirm: "Suspend", destructive: true },
} as const

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 break-words">{children || "-"}</dd>
    </div>
  )
}

export default function MerchantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { adminRole } = useAuth()
  const decide = canDecide(adminRole)
  const manage = canManage(adminRole)
  const [d, setD] = useState<Detail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState<Pending>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [team, setTeam] = useState("")

  const load = useCallback(async () => {
    const res = await api<Detail>(`/api/admin/merchants/${id}`)
    if (res.ok) { setD(res.data); setTeam(res.data.merchant.owner_team || ""); setError(null) } else setError(res.error)
  }, [id])
  useEffect(() => { load() }, [load])

  const run = async (path: string, init: RequestInit, success: string): Promise<boolean> => {
    setBusy(true); setDialogError(null); setNotice(null)
    const res = await api(path, init)
    setBusy(false)
    if (!res.ok) { setDialogError(res.error); setError(res.error); return false }
    setError(null); setNotice(success)
    await load()
    return true
  }

  const decision = async (action: string, reason: string, success: string) => {
    const ok = await run(`/api/admin/merchants/${id}/decision`, jsonBody("POST", { action, reason }), success)
    if (ok) setPending(null)
  }

  const docAction = async (docId: string, status: "approved" | "rejected", reason: string) => {
    const ok = await run(`/api/admin/merchants/${id}/documents/${docId}`, jsonBody("POST", { status, reason }), status === "approved" ? "Document approved." : "Document rejected.")
    if (ok) setPending(null)
  }

  if (!d) {
    return (
      <OfficeDashboardLayout>
        <p className="text-sm text-muted-foreground">{error || "Loading..."}</p>
      </OfficeDashboardLayout>
    )
  }

  const m = d.merchant
  const app = d.applications[0]
  const answers = app?.answers || {}
  const fieldDefs = d.kyb?.requirements?.fields || []
  const docDefs = d.kyb?.requirements?.documents || []
  const allApproved = d.documents.length > 0 && d.documents.every((x) => x.status === "approved")
  const missingDocs = docDefs.filter((r) => r.required && !d.documents.some((x) => x.kind === r.kind))
  const docLabel = (kind: string) => docDefs.find((r) => r.kind === kind)?.label || kind
  const inReview = m.status === "in_review"
  const approveBlock = !allApproved
    ? d.documents.length === 0 ? "No documents uploaded." : "Approve every document first."
    : null

  return (
    <OfficeDashboardLayout>
      <div className="space-y-4">
        <Link href="/merchants" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />Merchants
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{m.display_name}</h1>
          <MerchantStatusBadge status={m.status} />
          <span className="text-sm capitalize text-muted-foreground">{m.type}{m.kyb_tier ? ` • Tier ${m.kyb_tier}` : ""}</span>
          {m.office_managed && <span className="rounded-full bg-neutral-surface px-2 py-0.5 text-xs text-neutral-text">Office-managed</span>}
        </div>

        {notice && <p className="rounded-md bg-success-surface px-3 py-2 text-sm text-success-text" role="status">{notice}</p>}
        {error && <p className="rounded-md bg-destructive-surface px-3 py-2 text-sm text-destructive-text" role="alert">{error}</p>}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
              <CardContent>
                <dl>
                  <Row label="Display name">{m.display_name}</Row>
                  <Row label="Legal name">{m.legal_name}</Row>
                  <Row label="Based in">{m.country}</Row>
                  <Row label="Operates in">{m.operating_country}</Row>
                  <Row label="Languages">{m.languages?.join(", ")}</Row>
                  <Row label="Email">{m.contact_email}</Row>
                  <Row label="Phone">{m.contact_phone}</Row>
                  <Row label="Website">{m.website}</Row>
                  <Row label="Created">{formatDateTime(m.created_at)}</Row>
                  <Row label="Submitted">{m.submitted_at ? <>{formatDateTime(m.submitted_at)} (<RelativeAge iso={m.submitted_at} warn={inReview} /> ago)</> : null}</Row>
                  <Row label="Approved">{m.approved_at ? formatDateTime(m.approved_at) : null}</Row>
                  {m.rejection_reason && <Row label="Last reason">{m.rejection_reason}</Row>}
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Application{d.kyb?.label ? ` • ${d.kyb.label}` : ""}
                  {app && <span className="ml-2 align-middle"><MerchantStatusBadge status={app.status} /></span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!app ? <p className="text-sm text-muted-foreground">No application submitted.</p> : (
                  <dl>
                    <Row label="Tier">{answers.tier ? `Tier ${answers.tier}` : null}</Row>
                    {fieldDefs.map((f) => {
                      const v = String(answers.fields?.[f.key] ?? "").trim()
                      return (
                        <Row key={f.key} label={f.label}>
                          {v || (f.required ? <span className="font-medium text-destructive-text">Missing (required)</span> : null)}
                        </Row>
                      )
                    })}
                    {fieldDefs.length === 0 && Object.entries(answers.fields || {}).map(([k, v]) => <Row key={k} label={k}>{String(v)}</Row>)}
                    {missingDocs.length > 0 && (
                      <Row label="Missing documents">
                        <span className="font-medium text-destructive-text">{missingDocs.map((x) => x.label).join(", ")}</span>
                      </Row>
                    )}
                  </dl>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Documents</CardTitle></CardHeader>
              <CardContent>
                {d.documents.length === 0 && <p className="text-sm text-muted-foreground">No documents uploaded.</p>}
                <div className="divide-y">
                  {d.documents.map((doc) => (
                    <DocumentRow
                      key={doc.id}
                      doc={doc}
                      label={docLabel(doc.kind)}
                      canReview={decide}
                      busy={busy}
                      onApprove={() => docAction(doc.id, "approved", "")}
                      onReject={() => { setDialogError(null); setPending({ kind: "document", docId: doc.id }) }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Team</CardTitle></CardHeader>
              <CardContent>
                {d.members.length === 0 && <p className="text-sm text-muted-foreground">No members.</p>}
                <ul className="divide-y text-sm">
                  {d.members.map((mem) => {
                    const name = [mem.users?.first_name, mem.users?.last_name].filter(Boolean).join(" ")
                    return (
                      <li key={mem.user_id} className="flex items-center justify-between py-2">
                        <span>{name || mem.users?.email || mem.user_id}{name && mem.users?.email ? <span className="text-muted-foreground"> {"•"} {mem.users.email}</span> : null}</span>
                        <span className="capitalize text-muted-foreground">{mem.role}</span>
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Audit trail</CardTitle></CardHeader>
              <CardContent>
                {d.audit.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
                <ul className="divide-y text-sm">
                  {d.audit.map((a) => (
                    <li key={a.id} className="py-2">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span><span className="font-mono text-xs">{a.action}</span>
                          <span className="text-muted-foreground"> by {a.actor_kind}{a.actor_role ? ` (${a.actor_role})` : ""}{a.actor_id ? ` ${a.actor_id.slice(0, 8)}` : ""}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}</span>
                      </div>
                      {a.details?.reason && <p className="text-xs text-muted-foreground">{String(a.details.reason)}</p>}
                    </li>
                  ))}
                </ul>
                <Link href={`/audit`} className="mt-2 inline-block text-xs text-primary-text hover:underline">Open the full audit log</Link>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="space-y-4 lg:sticky lg:top-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Decision</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <MerchantStatusBadge status={m.status} />
                  </div>
                  {m.rejection_reason && ["rejected", "suspended"].includes(m.status) && (
                    <p className="rounded-md bg-muted p-2 text-xs">Merchant sees: {m.rejection_reason}</p>
                  )}

                  {!decide && <p className="text-xs text-muted-foreground">Your role can view this merchant but not decide.</p>}

                  {decide && inReview && (
                    <div className="space-y-2">
                      <Button className="w-full bg-primary text-primary-foreground" disabled={busy || !!approveBlock}
                        onClick={() => decision("approve", "", "Merchant approved and live.")}>
                        Approve
                      </Button>
                      {approveBlock && <p className="text-xs text-muted-foreground">{approveBlock}</p>}
                      <Button variant="outline" className="w-full" disabled={busy} onClick={() => { setDialogError(null); setPending({ kind: "decision", action: "request_changes" }) }}>Request changes</Button>
                      <Button variant="destructive" className="w-full" disabled={busy} onClick={() => { setDialogError(null); setPending({ kind: "decision", action: "reject" }) }}>Reject</Button>
                    </div>
                  )}

                  {decide && (m.status === "live" || m.status === "paused") && (
                    <Button variant="destructive" className="w-full" disabled={busy} onClick={() => { setDialogError(null); setPending({ kind: "decision", action: "suspend" }) }}>Suspend</Button>
                  )}
                  {decide && m.status === "suspended" && (
                    <Button className="w-full bg-primary text-primary-foreground" disabled={busy} onClick={() => decision("reinstate", "", "Merchant reinstated (paused).")}>Reinstate</Button>
                  )}
                  {decide && !inReview && !["live", "paused", "suspended"].includes(m.status) && (
                    <p className="text-xs text-muted-foreground">No decision is pending.</p>
                  )}
                </CardContent>
              </Card>

              {manage && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Owner team</CardTitle></CardHeader>
                  <CardContent className="flex gap-2">
                    <Input value={team} maxLength={40} onChange={(e) => setTeam(e.target.value)} aria-label="Owner team" />
                    <Button variant="outline" disabled={busy || !team.trim() || team.trim() === m.owner_team}
                      onClick={() => run(`/api/admin/merchants/${id}`, jsonBody("PATCH", { owner_team: team.trim() }), "Owner team updated.")}>
                      Save
                    </Button>
                  </CardContent>
                </Card>
              )}
              {!manage && <p className="text-xs text-muted-foreground">Owner team: {m.owner_team || "-"}</p>}

              <Card>
                <CardHeader><CardTitle className="text-base">Money</CardTitle></CardHeader>
                <CardContent>
                  <Link href={`/finance/merchants/${id}`} className="text-sm text-primary-text hover:underline">Balances, earnings and payouts</Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {pending?.kind === "decision" && (
        <DecisionDialog
          open
          onOpenChange={(o) => { if (!o) setPending(null) }}
          title={DIALOG_COPY[pending.action].title}
          confirmLabel={DIALOG_COPY[pending.action].confirm}
          destructive={DIALOG_COPY[pending.action].destructive}
          busy={busy}
          error={dialogError}
          onConfirm={(reason) => decision(pending.action, reason,
            pending.action === "reject" ? "Application rejected." : pending.action === "suspend" ? "Merchant suspended." : "Changes requested.")}
        />
      )}
      {pending?.kind === "document" && (
        <DecisionDialog
          open
          onOpenChange={(o) => { if (!o) setPending(null) }}
          title="Reject document"
          confirmLabel="Reject document"
          destructive
          minLength={3}
          busy={busy}
          error={dialogError}
          onConfirm={(reason) => docAction(pending.docId, "rejected", reason)}
        />
      )}
    </OfficeDashboardLayout>
  )
}
