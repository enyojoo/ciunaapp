"use client"
import * as React from "react"
import { CalendarOff } from "lucide-react"
import { Banner, Button, Card, CardBody, CardHeader, ConfirmDialog, Field, Input, Select } from "@ciuna/ui-web"
import { api } from "@/lib/api"
import { invalidate } from "@/lib/query"
import { useT } from "@/lib/i18n"
import { dateKeyInZone } from "./logic"
import { useExpertError, type ExpertService } from "./shared"

/** Blocks every open slot in a date range (holiday mode). Booked sessions are never touched. */
export function TimeOffPanel({ services, zone, defaultServiceId, onDone }: { services: ExpertService[]; zone: string; defaultServiceId?: string; onDone: () => void }) {
  const { t } = useT()
  const errText = useExpertError()
  const today = dateKeyInZone(new Date(), zone)
  const [from, setFrom] = React.useState(today)
  const [to, setTo] = React.useState(today)
  const [serviceId, setServiceId] = React.useState("")
  const [confirm, setConfirm] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<{ tone: "success" | "destructive"; text: string } | null>(null)
  const invalid = !from || !to || to < from

  async function block() {
    setBusy(true)
    try {
      const res = await api<{ blocked: number }>("/api/merchant/expert/time-off", { method: "POST", json: { from, to, timezone: zone, serviceId: serviceId || undefined } })
      invalidate("expert/")
      setResult({ tone: "success", text: t("expert.timeoff.done", { count: res.blocked }) })
      onDone()
    } catch (e) {
      setResult({ tone: "destructive", text: errText(e) })
    } finally {
      setBusy(false)
      setConfirm(false)
    }
  }

  const scope = serviceId ? services.find((s) => s.id === serviceId)?.title ?? "" : t("expert.timeoff.all")

  return (
    <Card>
      <CardHeader title={t("expert.timeoff.title")} description={t("expert.timeoff.hint")} />
      <CardBody className="space-y-4">
        {result ? <Banner tone={result.tone} title={result.text} /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("expert.timeoff.from")}><Input type="date" value={from} min={today} onChange={(e) => { setFrom(e.target.value); if (to < e.target.value) setTo(e.target.value) }} /></Field>
          <Field label={t("expert.timeoff.to")} error={to && from && to < from ? t("expert.avail.window.order") : null}><Input type="date" value={to} min={from || today} onChange={(e) => setTo(e.target.value)} /></Field>
        </div>
        {services.length > 1 ? (
          <Field label={t("expert.timeoff.service")}>
            <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              <option value="">{t("expert.timeoff.all")}</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </Select>
          </Field>
        ) : null}
        <p className="text-sm text-muted">{t("expert.timeoff.zone", { zone })}</p>
        <Button variant="secondary" disabled={invalid} onClick={() => { setResult(null); setConfirm(true) }}><CalendarOff />{t("expert.timeoff.action")}</Button>
      </CardBody>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title={t("expert.timeoff.confirm", { from, to })} description={t("expert.timeoff.confirm.body", { scope, zone })} confirmLabel={t("expert.timeoff.action")} cancelLabel={t("action.cancel")} busy={busy} onConfirm={block} />
    </Card>
  )
}
