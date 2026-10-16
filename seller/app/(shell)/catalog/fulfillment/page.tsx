"use client"
import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Check, Circle, Plus, Trash2 } from "lucide-react"
import { Banner, Button, Card, CardBody, CardHeader, Chip, Field, Input, PageHeader, Select, Skeleton, Switch, Textarea, useToast } from "@ciuna/ui-web"
import { api, ApiError } from "@/lib/api"
import { invalidate, useQuery } from "@/lib/query"
import { useSeller } from "@/lib/session"
import { useErrorText, useT } from "@/lib/i18n"
import { CURRENCIES } from "@/components/catalog/csv"
import { num, type FulfillmentData } from "@/components/catalog/shared"

interface Zone { city: string; district: string; fee: string; currency: string; active: boolean }
const ctl = "h-12 md:h-11"

export default function FulfillmentPage() {
  const { t } = useT()
  const errText = useErrorText()
  const toast = useToast()
  const { merchant } = useSeller()
  const q = useQuery<FulfillmentData>("fulfillment", () => api<FulfillmentData>("/api/merchant/fulfillment"))
  const currency = merchant?.default_currency ?? "USD"

  const [loaded, setLoaded] = React.useState(false)
  const [location, setLocation] = React.useState("")
  const [hours, setHours] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [zones, setZones] = React.useState<Zone[]>([])
  const [dirty, setDirty] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<Record<number, string>>({})

  // Seed once from the first data we get; later background refreshes never overwrite edits.
  React.useEffect(() => {
    if (!q.data || loaded) return
    setLocation(q.data.pickup.location ?? "")
    setHours(q.data.pickup.hours ?? "")
    setNotes(q.data.notes ?? "")
    setZones(q.data.zones.filter((z) => z.active).map((z) => ({ city: z.city, district: z.district, fee: String(Number(z.fee)), currency: z.currency, active: true })).concat(q.data.zones.filter((z) => !z.active).map((z) => ({ city: z.city, district: z.district, fee: String(Number(z.fee)), currency: z.currency, active: false }))))
    setLoaded(true)
  }, [q.data, loaded])

  React.useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = "" }
    window.addEventListener("beforeunload", h)
    return () => window.removeEventListener("beforeunload", h)
  }, [dirty])

  const hasPickup = location.trim().length > 0
  const hasZone = zones.some((z) => z.active && z.city.trim() && z.district.trim())
  const touch = () => setDirty(true)
  const upd = (i: number, patch: Partial<Zone>) => { setZones((z) => z.map((x, j) => (j === i ? { ...x, ...patch } : x))); touch() }
  const key = (z: Zone) => `${z.city.trim().toLowerCase()}|${z.district.trim().toLowerCase()}`

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const errs: Record<number, string> = {}
    const seen = new Set<string>()
    zones.forEach((z, i) => {
      if (!z.city.trim() || !z.district.trim()) errs[i] = t("errors.ZONE_INVALID")
      else if (!(num(z.fee) >= 0)) errs[i] = t("errors.ZONE_FEE_INVALID")
      else if (seen.has(key(z))) errs[i] = t("errors.ZONE_DUPLICATE")
      seen.add(key(z))
    })
    setFieldErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      await api("/api/merchant/fulfillment", {
        method: "PUT",
        json: { pickup: { location: location.trim(), hours: hours.trim() }, notes: notes.trim(), zones: zones.map((z) => ({ city: z.city.trim(), district: z.district.trim(), fee: num(z.fee), currency: z.currency, active: z.active })) },
      })
      invalidate("fulfillment")
      setDirty(false)
      toast.show(t("catalog.toast.fulfilmentSaved"))
    } catch (err) {
      setError(errText(err instanceof ApiError ? err.code : undefined))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl lg:max-w-5xl">
      <PageHeader
        back={<Link href="/catalog" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="size-4" />{t("catalog.back")}</Link>}
        title={t("catalog.fulfilment.title")}
        description={t("catalog.fulfilment.intro")}
      />
      {q.error && !q.data ? (
        <Banner tone="destructive" title={errText(q.error.code)} action={<Button size="sm" variant="secondary" onClick={() => void q.reload()}>{t("action.retry")}</Button>} />
      ) : !loaded ? (
        <div className="space-y-4"><Skeleton className="h-52" /><Skeleton className="h-64" /></div>
      ) : (
        <form onSubmit={save} className="space-y-4" noValidate>
          {error ? <Banner tone="destructive" title={error} /> : null}
          {!hasPickup ? <Banner tone="warning" title={t("catalog.fulfilment.pickupMissing")} /> : null}
          {!hasZone ? <Banner tone="warning" title={t("catalog.fulfilment.zonesMissing")} /> : null}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="space-y-4">
          <Card>
            <CardHeader title={t("catalog.fulfilment.pickup")} description={t("catalog.fulfilment.pickupHint")} />
            <CardBody className="space-y-4">
              <Field label={t("catalog.fulfilment.location")}>
                <Input className={ctl} value={location} maxLength={300} onChange={(e) => { setLocation(e.target.value); touch() }} />
              </Field>
              <Field label={t("catalog.fulfilment.hours")} hint={t("catalog.fulfilment.hoursHint")}>
                <Input className={ctl} value={hours} maxLength={200} onChange={(e) => { setHours(e.target.value); touch() }} />
              </Field>
              <Field label={t("catalog.fulfilment.notes")}>
                <Textarea rows={3} value={notes} maxLength={1000} onChange={(e) => { setNotes(e.target.value); touch() }} />
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t("catalog.fulfilment.zones")} description={t("catalog.fulfilment.zonesHint")} />
            <CardBody className="space-y-4">
              {zones.length === 0 ? <p className="text-sm text-muted">{t("catalog.fulfilment.noZones")}</p> : null}
              {zones.map((z, i) => (
                <div key={i} className="space-y-3 rounded-2xl border border-hairline p-3">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.2fr_1.2fr_0.8fr_0.7fr]">
                    <Field label={t("catalog.fulfilment.city")}><Input className={ctl} value={z.city} maxLength={80} onChange={(e) => upd(i, { city: e.target.value })} /></Field>
                    <Field label={t("catalog.fulfilment.district")}><Input className={ctl} value={z.district} maxLength={80} onChange={(e) => upd(i, { district: e.target.value })} /></Field>
                    <Field label={t("catalog.fulfilment.fee")}><Input className={ctl} inputMode="decimal" value={z.fee} onChange={(e) => upd(i, { fee: e.target.value })} /></Field>
                    <Field label={t("catalog.field.currency")}>
                      <Select className={ctl} value={z.currency} onChange={(e) => upd(i, { currency: e.target.value })}>
                        {(CURRENCIES.includes(z.currency) ? CURRENCIES : [z.currency, ...CURRENCIES]).map((c) => <option key={c} value={c}>{c}</option>)}
                      </Select>
                    </Field>
                  </div>
                  {fieldErrors[i] ? <p role="alert" className="text-sm text-destructive-text">{fieldErrors[i]}</p> : null}
                  <div className="flex min-h-12 items-center justify-between gap-3">
                    <span className="flex items-center gap-3 text-sm font-medium text-ink">
                      <Switch checked={z.active} onCheckedChange={(v) => upd(i, { active: v })} label={t("catalog.fulfilment.active")} />
                      {z.active ? t("catalog.fulfilment.active") : t("catalog.fulfilment.inactive")}
                    </span>
                    <Button type="button" variant="ghost" onClick={() => { setZones((all) => all.filter((_, j) => j !== i)); touch() }} className="h-12 text-destructive-text md:h-11">
                      <Trash2 />
                      {t("action.remove")}
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="secondary" className="h-12 md:h-11" onClick={() => { setZones((all) => [...all, { city: "", district: "", fee: "0", currency, active: true }]); touch() }}>
                <Plus />
                {t("catalog.fulfilment.addZone")}
              </Button>
            </CardBody>
          </Card>

          </div>
          <Card className="lg:sticky lg:top-20">
            <CardHeader title={t("catalog.fulfilment.unlocks")} />
            <CardBody>
              <ul className="space-y-3">
                {[
                  { ok: hasPickup, label: t("catalog.fulfilment.unlock.pickup"), help: t("catalog.fulfilment.unlock.pickupHelp") },
                  { ok: hasZone, label: t("catalog.fulfilment.unlock.delivery"), help: t("catalog.fulfilment.unlock.deliveryHelp") },
                  { ok: true, label: t("catalog.fulfilment.unlock.digital"), help: t("catalog.fulfilment.unlock.digitalHelp") },
                ].map((u) => (
                  <li key={u.label} className="flex items-start gap-3">
                    {u.ok ? <Check className="mt-0.5 size-5 shrink-0 rounded-full bg-success-surface p-0.5 text-success-text" aria-hidden /> : <Circle className="mt-0.5 size-5 shrink-0 text-subtle" aria-hidden />}
                    <div className="min-w-0 flex-1"><p className="text-[15px] font-semibold text-ink">{u.label}</p><p className="text-sm text-muted">{u.help}</p></div>
                    <Chip tone={u.ok ? "success" : "neutral"}>{t(u.ok ? "setup.done" : "setup.todo")}</Chip>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
          </div>

          <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 -mx-4 flex items-center justify-end gap-3 border-t border-hairline bg-white/95 px-4 py-3 backdrop-blur md:bottom-0 md:mx-0 md:rounded-2xl md:border">
            {dirty ? <span className="mr-auto text-sm font-medium text-warning-text">{t("catalog.form.unsaved")}</span> : null}
            <Button type="submit" size="lg" busy={busy} disabled={!dirty}>{t("action.save")}</Button>
          </div>
        </form>
      )}
    </div>
  )
}
