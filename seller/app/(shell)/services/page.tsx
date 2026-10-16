"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Briefcase, Plus } from "lucide-react"
import { Amount, Banner, Button, Card, ConfirmDialog, EmptyState, PageHeader, Skeleton, StatusBadge, Switch, useToast } from "@ciuna/ui-web"
import { RequirePermission } from "@/components/no-access"
import { api } from "@/lib/api"
import { invalidate } from "@/lib/query"
import { useSeller } from "@/lib/session"
import { useT } from "@/lib/i18n"
import { Chip, ExpertOnly, FULFILLMENT_KEYS, useExpertError, useServices, type ExpertService } from "@/components/expert/shared"
import { formatDuration } from "@/components/expert/logic"

export default function ServicesPage() {
  return <RequirePermission permission="catalog"><ServicesPageContent /></RequirePermission>
}

function ServicesPageContent() {
  return <ExpertOnly><Services /></ExpertOnly>
}

function Services() {
  const { t } = useT()
  const router = useRouter()
  const toast = useToast()
  const errText = useExpertError()
  const { merchant, can } = useSeller()
  const { data, error, loading, reload } = useServices()
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [confirm, setConfirm] = React.useState<ExpertService | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)
  const canEdit = can("catalog")
  const live = merchant?.status === "live"

  async function publish(s: ExpertService) {
    setMessage(null)
    if (!s.meeting_instructions?.trim()) {
      toast.show(t("expert.services.needs_instructions"), "error")
      router.push(`/services/${s.id}`)
      return
    }
    setBusyId(s.id)
    try {
      await api(`/api/merchant/expert/services/${s.id}`, { method: "PATCH", json: { is_published: true } })
      invalidate("expert/")
      await reload()
      toast.show(t("expert.form.toast.published"))
    } catch (e) {
      setMessage(errText(e))
    } finally {
      setBusyId(null)
    }
  }

  async function unpublish(s: ExpertService) {
    setBusyId(s.id)
    try {
      await api(`/api/merchant/expert/services/${s.id}`, { method: "DELETE" })
      invalidate("expert/")
      await reload()
      toast.show(t("expert.form.toast.unpublished"))
    } catch (e) {
      setMessage(errText(e))
    } finally {
      setBusyId(null)
      setConfirm(null)
    }
  }

  const units = { h: t("expert.unit.h"), min: t("expert.unit.min") }

  return (
    <div>
      <PageHeader title={t("expert.services.title")} description={t("expert.services.subtitle")} action={canEdit ? <Button asChild><Link href="/services/new"><Plus />{t("expert.services.add")}</Link></Button> : undefined} />
      <div className="space-y-4">
        {message ? <Banner tone="destructive" title={message} /> : null}
        {!live && data?.services.length ? <Banner tone="warning" title={t("expert.form.notlive.title")}>{t("errors.MERCHANT_NOT_LIVE")}</Banner> : null}
        {loading ? (
          <div className="space-y-3"><Skeleton className="h-36" /><Skeleton className="h-36" /></div>
        ) : error && !data ? (
          <Banner tone="destructive" title={errText(error)} action={<Button size="sm" variant="secondary" onClick={() => void reload()}>{t("action.retry")}</Button>} />
        ) : !data?.services.length ? (
          <Card><EmptyState icon={<Briefcase />} title={t("expert.services.empty.title")} description={t("expert.services.empty.body")} action={canEdit ? <Button asChild><Link href="/services/new">{t("expert.services.add")}</Link></Button> : undefined} /></Card>
        ) : (
          data.services.map((s) => {
            const price = s.pricing_type === "fixed" ? { v: s.fixed_amount, c: s.fixed_currency } : { v: s.hourly_rate, c: s.hourly_currency }
            const open = s.upcoming_slots ?? 0
            return (
              <Card key={s.id} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/services/${s.id}`} className="min-w-0 flex-1 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
                    <h2 className="truncate text-base font-semibold">{s.title}</h2>
                    <p className="mt-1 text-sm text-muted">
                      {s.pricing_type === "quote" ? t("expert.pricing.quote") : <><Amount value={price.v} currency={price.c} />{s.pricing_type === "hourly" ? ` ${t("expert.services.per_hour")}` : ""}</>}
                      {s.default_duration_minutes ? ` · ${formatDuration(s.default_duration_minutes, units)}` : ""}
                    </p>
                  </Link>
                  <StatusBadge status={s.is_published ? "live" : "draft"} label={s.is_published ? t("status.live") : t("status.draft")} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Chip>{t(FULFILLMENT_KEYS[s.fulfillment_type] ?? FULFILLMENT_KEYS.online)}</Chip>
                  {open === 0 ? <Chip tone="warning">{t("expert.services.slots.none")}</Chip> : <span className="text-sm text-muted">{t("expert.services.slots", { count: open })}</span>}
                  {open === 0 ? <Link href="/availability" className="text-sm font-semibold text-primary-text underline-offset-4 hover:underline">{t("expert.services.slots.set")}</Link> : null}
                </div>
                {canEdit ? (
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-hairline pt-3">
                    <span className="text-sm font-medium">{s.is_published ? t("expert.services.published") : t("expert.services.publish")}</span>
                    <Switch checked={s.is_published} label={t("expert.services.publish_toggle", { title: s.title })} disabled={busyId === s.id || (!s.is_published && (!live || s.pricing_type === "quote"))} onCheckedChange={(v) => (v ? publish(s) : setConfirm(s))} />
                  </div>
                ) : null}
              </Card>
            )
          })
        )}
      </div>
      <ConfirmDialog open={Boolean(confirm)} onOpenChange={(o) => !o && setConfirm(null)} title={t("expert.form.unpublish.confirm")} description={t("expert.form.unpublish.confirm.body")} confirmLabel={t("expert.form.unpublish.action")} cancelLabel={t("action.cancel")} destructive busy={Boolean(confirm && busyId === confirm.id)} onConfirm={() => confirm && unpublish(confirm)} />
    </div>
  )
}
