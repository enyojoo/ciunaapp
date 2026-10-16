"use client"
import * as React from "react"
import { Landmark, Plus, Trash2 } from "lucide-react"
import { Banner, Button, Card, ConfirmDialog, EmptyState, PageHeader, Skeleton, StatusBadge, useToast } from "@ciuna/ui-web"
import { SellerNoAccess } from "@/components/no-access"
import { api, ApiError } from "@/lib/api"
import { invalidate, useQuery } from "@/lib/query"
import { useSeller } from "@/lib/session"
import { useErrorText, useT } from "@/lib/i18n"
import { EarningsSubnav } from "@/components/earnings/subnav"
import { AddMethodSheet } from "@/components/earnings/add-method-sheet"
import type { PayoutMethod } from "@/components/earnings/logic"

export default function MethodsPage() {
  const { merchant, can } = useSeller()
  const { t } = useT()
  const errText = useErrorText()
  const toast = useToast()
  const list = useQuery<{ methods: PayoutMethod[] }>(can("payouts") ? "payout-methods" : null, () => api("/api/merchant/payout-methods"))
  const [adding, setAdding] = React.useState(false)
  const [removing, setRemoving] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  if (!merchant) return null
  if (!can("payouts")) return (
    <SellerNoAccess pageTitle={t("earnings.methods.title")} titleKey="earnings.payouts.noAccess.title" bodyKey="earnings.payouts.noAccess.body" />
  )

  async function makeDefault(id: string) {
    try { await api(`/api/merchant/payout-methods/${id}`, { method: "PATCH" }); invalidate("payout-methods"); await list.reload(); toast.show(t("earnings.methods.defaultSet")) } catch (e) { toast.show(errText(e instanceof ApiError ? e.code : undefined), "error") }
  }
  async function remove() {
    if (!removing) return
    setBusy(true)
    try { await api(`/api/merchant/payout-methods/${removing}`, { method: "DELETE" }); invalidate("payout-methods"); await list.reload(); toast.show(t("earnings.methods.removed")) } catch (e) { toast.show(errText(e instanceof ApiError ? e.code : undefined), "error") } finally { setBusy(false); setRemoving(null) }
  }

  const methods = list.data?.methods ?? []
  return (
    <>
      <PageHeader title={t("earnings.methods.title")} description={t("earnings.methods.subtitle")} action={<Button onClick={() => setAdding(true)}><Plus className="size-4" />{t("earnings.methods.add")}</Button>} />
      <EarningsSubnav />
      <div className="space-y-3">
        <Banner title={t("earnings.methods.verify.title")}>{t("earnings.methods.verify.body")}</Banner>
        {list.error && !list.data ? <Banner tone="destructive" title={errText(list.error.code)} action={<Button variant="secondary" onClick={() => list.reload()}>{t("action.retry")}</Button>} /> : null}
        {list.loading && !list.data ? <Skeleton className="h-24" /> : null}
        {list.data && !methods.length ? (
          <Card><EmptyState icon={<Landmark />} title={t("earnings.methods.empty.title")} description={t("earnings.methods.empty.body")} action={<Button onClick={() => setAdding(true)}>{t("earnings.methods.add")}</Button>} /></Card>
        ) : null}
        {methods.map((m) => (
          <Card key={m.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{m.label}{m.is_default ? <span className="ml-2 text-sm font-medium text-muted">· {t("earnings.methods.default")}</span> : null}</p>
              <p className="text-sm text-muted">{t(`earnings.kind.${m.kind}`)} · {m.currency}{m.last4 ? ` · ••${m.last4}` : ""}</p>
            </div>
            <StatusBadge status={m.verified ? "verified" : "pending"} label={m.verified ? t("earnings.methods.verified") : t("earnings.methods.waiting")} />
            <div className="flex items-center gap-1">
              {!m.is_default ? <Button variant="ghost" onClick={() => makeDefault(m.id)}>{t("earnings.methods.makeDefault")}</Button> : null}
              <button type="button" aria-label={t("action.remove")} onClick={() => setRemoving(m.id)} className="flex size-10 items-center justify-center rounded-full text-destructive-text hover:bg-destructive-surface"><Trash2 className="size-4" /></button>
            </div>
          </Card>
        ))}
      </div>
      <AddMethodSheet open={adding} onOpenChange={setAdding} defaultCurrency={merchant.default_currency} onAdded={() => { invalidate("payout-methods"); void list.reload() }} />
      <ConfirmDialog open={Boolean(removing)} onOpenChange={(o) => !o && setRemoving(null)} title={t("earnings.methods.remove.q")} description={t("earnings.methods.remove.body")} confirmLabel={t("action.remove")} cancelLabel={t("action.cancel")} destructive busy={busy} onConfirm={remove} />
    </>
  )
}
