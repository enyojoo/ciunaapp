"use client"
import * as React from "react"
import Link from "next/link"
import { Banknote, Lock } from "lucide-react"
import { Amount, Banner, Button, Card, ConfirmDialog, EmptyState, PageHeader, Skeleton, StatusBadge, useToast } from "@ciuna/ui-web"
import { api, ApiError } from "@/lib/api"
import { invalidate, useQuery } from "@/lib/query"
import { useSeller } from "@/lib/session"
import { useErrorText, useT } from "@/lib/i18n"
import { EarningsSubnav } from "@/components/earnings/subnav"
import { PAYOUT_STATUS_KEY, PAYOUT_STATUS_TONE_WORD, useDate } from "@/components/earnings/format"

interface Payout {
  id: string; currency: string; amount: number; fee: number; net: number
  status: "requested" | "approved" | "paid" | "rejected" | "cancelled"
  reference: string | null; reason: string | null
  method_snapshot: { kind?: string; label?: string; last4?: string | null } | null
  requested_at: string; decided_at: string | null; paid_at: string | null
}

export default function PayoutsPage() {
  const { merchant, can } = useSeller()
  const { t } = useT()
  const errText = useErrorText()
  const toast = useToast()
  const date = useDate()
  const list = useQuery<{ payouts: Payout[] }>(can("payouts") ? "payouts" : null, () => api("/api/merchant/payouts"), { refreshMs: 60_000 })
  const [cancelling, setCancelling] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  if (!merchant) return null
  if (!can("payouts")) return (
    <>
      <PageHeader title={t("earnings.payouts.title")} />
      <EmptyState icon={<Lock />} title={t("earnings.payouts.noAccess.title")} description={t("earnings.payouts.noAccess.body")} />
    </>
  )

  async function cancel() {
    if (!cancelling) return
    setBusy(true)
    try {
      await api(`/api/merchant/payouts/${cancelling}/cancel`, { method: "POST" })
      invalidate("earnings"); invalidate("payouts")
      toast.show(t("earnings.payout.cancelled"))
      await list.reload()
    } catch (e) { toast.show(errText(e instanceof ApiError ? e.code : undefined), "error") } finally { setBusy(false); setCancelling(null) }
  }

  const payouts = list.data?.payouts ?? []
  return (
    <>
      <PageHeader title={t("earnings.payouts.title")} description={t("earnings.payouts.subtitle")} />
      <EarningsSubnav />
      <div className="space-y-3">
        {list.error && !list.data ? <Banner tone="destructive" title={errText(list.error.code)} action={<Button variant="secondary" onClick={() => list.reload()}>{t("action.retry")}</Button>} /> : null}
        {list.loading && !list.data ? <><Skeleton className="h-32" /><Skeleton className="h-32" /></> : null}
        {list.data && !payouts.length ? (
          <Card><EmptyState icon={<Banknote />} title={t("earnings.payouts.empty.title")} description={t("earnings.payouts.empty.body")} action={<Link href="/earnings" className="inline-flex h-11 items-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary-hover">{t("earnings.payouts.empty.cta")}</Link>} /></Card>
        ) : null}
        {payouts.map((p) => {
          const m = p.method_snapshot
          return (
            <Card key={p.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted">{t("earnings.payout.requestedOn", { date: date(p.requested_at) })}</p>
                  <p className="mt-0.5"><Amount value={p.amount} currency={p.currency} size="large" /></p>
                </div>
                <StatusBadge status={PAYOUT_STATUS_TONE_WORD[p.status] ?? "neutral"} label={t(PAYOUT_STATUS_KEY[p.status] ?? "earnings.payout.status.requested")} />
              </div>
              <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                <Row label={t("earnings.payout.fee")}><Amount value={p.fee} currency={p.currency} /></Row>
                <Row label={t("earnings.payout.received")}><Amount value={p.net} currency={p.currency} /></Row>
                <Row label={t("earnings.payout.method")}><span>{m?.label || t(`earnings.kind.${m?.kind ?? "bank"}`)}{m?.last4 ? ` ••${m.last4}` : ""}</span></Row>
                {p.status === "paid" && p.paid_at ? <Row label={t("earnings.payout.paidOn")}><span>{date(p.paid_at)}</span></Row> : null}
                {p.status === "paid" && p.reference ? <Row label={t("earnings.payout.reference")}><span className="break-all">{p.reference}</span></Row> : null}
              </dl>
              <p className="mt-3 text-sm text-muted">{t(`earnings.payout.note.${p.status}`)}</p>
              {p.status === "rejected" && p.reason ? <div className="mt-3"><Banner tone="destructive" title={t("earnings.payout.reason")}>{p.reason}</Banner></div> : null}
              {p.status === "requested" ? <div className="mt-3"><Button variant="secondary" onClick={() => setCancelling(p.id)}>{t("earnings.payout.cancel")}</Button></div> : null}
            </Card>
          )
        })}
      </div>
      <ConfirmDialog open={Boolean(cancelling)} onOpenChange={(o) => !o && setCancelling(null)} title={t("earnings.payout.cancel.q")} description={t("earnings.payout.cancel.body")} confirmLabel={t("earnings.payout.cancel.confirm")} cancelLabel={t("earnings.payout.cancel.keep")} destructive busy={busy} onConfirm={cancel} />
    </>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-baseline justify-between gap-3"><dt className="text-muted">{label}</dt><dd className="text-right">{children}</dd></div>
}
