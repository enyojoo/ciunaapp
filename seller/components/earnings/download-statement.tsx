"use client"
import * as React from "react"
import { Download } from "lucide-react"
import { Button, Card, CardBody, Field, Input, useToast } from "@ciuna/ui-web"
import { ApiError } from "@/lib/api"
import { useErrorText, useT } from "@/lib/i18n"
import { downloadCsv } from "./download"
import { currentMonthRange, validRange } from "./logic"

export function DownloadStatement() {
  const { t } = useT()
  const errText = useErrorText()
  const toast = useToast()
  const [range, setRange] = React.useState(() => currentMonthRange())
  const [busy, setBusy] = React.useState(false)
  const ok = validRange(range.from, range.to)
  async function go() {
    if (!ok) return
    setBusy(true)
    try { await downloadCsv(`/api/merchant/earnings/export?from=${range.from}&to=${range.to}`, `ciuna-statement-${range.from}-${range.to}.csv`) } catch (e) { toast.show(errText(e instanceof ApiError ? e.code : undefined), "error") } finally { setBusy(false) }
  }
  return (
    <Card>
      <CardBody>
        <p className="font-semibold">{t("earnings.download.title")}</p>
        <p className="mt-0.5 text-sm text-muted">{t("earnings.download.help")}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 sm:items-end lg:grid-cols-[1fr_1fr_auto]">
          <Field label={t("earnings.download.from")}><Input type="date" value={range.from} max={range.to} onChange={(e) => setRange({ ...range, from: e.target.value })} /></Field>
          <Field label={t("earnings.download.to")} error={range.from && range.to && !ok ? errText("DATE_INVALID") : null}><Input type="date" value={range.to} min={range.from} onChange={(e) => setRange({ ...range, to: e.target.value })} /></Field>
          <Button variant="secondary" className="sm:col-span-2 lg:col-span-1" onClick={go} busy={busy} disabled={!ok}><Download className="size-4" />{t("earnings.download.cta")}</Button>
        </div>
      </CardBody>
    </Card>
  )
}
