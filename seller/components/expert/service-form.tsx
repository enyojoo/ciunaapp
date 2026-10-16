"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Banner, Button, Card, CardBody, CardHeader, ConfirmDialog, Field, Input, LanguageTabs, PageHeader, Select, StatusBadge, Textarea, useToast } from "@ciuna/ui-web"
import { api } from "@/lib/api"
import { invalidate } from "@/lib/query"
import { useSeller } from "@/lib/session"
import { useT } from "@/lib/i18n"
import { CURRENCIES, FULFILLMENT_KEYS, SERVICES_KEY, useExpertError, type ExpertService } from "./shared"
import { browserTimeZone, formatDuration, timeZoneList } from "./logic"
import { UnitInput } from "./unit-input"

interface FormState {
  title: string
  short: string
  pricing: "hourly" | "fixed"
  amount: string
  currency: string
  duration: number | null
  minSession: number | null
  maxSession: number | null
  fulfillment: "online" | "in_person" | "both"
  instructions: string
  lead: number | null
  cutoff: number | null
  timezone: string
  translations: Record<string, { title: string; short_description: string }>
}

function initial(s: ExpertService | null, defaultCurrency: string): FormState {
  const pricing = s?.pricing_type === "fixed" ? "fixed" : "hourly"
  return {
    title: s?.title ?? "",
    short: s?.short_description ?? "",
    pricing,
    amount: s ? String((pricing === "fixed" ? s.fixed_amount : s.hourly_rate) ?? "") : "",
    currency: (s ? (pricing === "fixed" ? s.fixed_currency : s.hourly_currency) : null) ?? defaultCurrency,
    duration: s?.default_duration_minutes ?? 60,
    minSession: s?.min_session_minutes ?? null,
    maxSession: s?.max_session_minutes ?? null,
    fulfillment: s?.fulfillment_type ?? "online",
    instructions: s?.meeting_instructions ?? "",
    lead: s?.booking_lead_minutes ?? 120,
    cutoff: s?.payment_cutoff_minutes ?? 60,
    timezone: s ? s.timezone : browserTimeZone(),
    translations: Object.fromEntries(Object.entries(s?.translations ?? {}).map(([l, v]) => [l, { title: v?.title ?? "", short_description: v?.short_description ?? "" }])),
  }
}

export function ServiceForm({ service }: { service: ExpertService | null }) {
  const { t } = useT()
  const router = useRouter()
  const toast = useToast()
  const errText = useExpertError()
  const { merchant } = useSeller()
  const languages = merchant?.languages?.length ? merchant.languages : ["en"]
  const defaultLang = merchant?.default_language && languages.includes(merchant.default_language) ? merchant.default_language : languages[0]
  const startRef = React.useRef<FormState>(initial(service, merchant?.default_currency ?? "RUB"))
  const [f, setF] = React.useState<FormState>(startRef.current)
  const [lang, setLang] = React.useState(defaultLang)
  const [submitted, setSubmitted] = React.useState(false)
  const [publishTried, setPublishTried] = React.useState(false)
  const [busy, setBusy] = React.useState<null | "draft" | "publish" | "unpublish">(null)
  const [error, setError] = React.useState<string | null>(null)
  const [confirm, setConfirm] = React.useState(false)
  const [published, setPublished] = React.useState(Boolean(service?.is_published))
  const [savedId, setSavedId] = React.useState<string | null>(service?.id ?? null)

  const dirty = JSON.stringify(f) !== JSON.stringify(startRef.current)
  React.useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener("beforeunload", h)
    return () => window.removeEventListener("beforeunload", h)
  }, [dirty])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((cur) => ({ ...cur, [k]: v }))
  const zones = React.useMemo(() => timeZoneList(f.timezone), [f.timezone])
  const currencies = React.useMemo(() => (CURRENCIES.includes(f.currency) ? CURRENCIES : [f.currency, ...CURRENCIES]), [f.currency])
  const live = merchant?.status === "live"

  const amountNum = Number(f.amount.replace(",", "."))
  const errs = {
    title: !f.title.trim() ? t("expert.form.err.title") : null,
    amount: !(amountNum > 0) ? t("expert.form.err.amount") : null,
    duration: !f.duration || f.duration <= 0 ? t("expert.form.err.duration") : null,
    range: f.minSession && f.maxSession && f.minSession > f.maxSession ? t("expert.form.err.range") : null,
    lead: f.lead == null || f.lead < 0 ? t("expert.form.err.number") : null,
    cutoff: f.cutoff == null || f.cutoff < 0 ? t("expert.form.err.number") : null,
  }
  const instructionsMissing = !f.instructions.trim() ? t("expert.form.err.instructions") : null
  const show = <K extends keyof typeof errs>(k: K) => (submitted ? errs[k] : null)

  // The default language lives in title/short_description; others in translations.
  const tr = (l: string) => (l === defaultLang ? { title: f.title, short_description: f.short } : f.translations[l] ?? { title: "", short_description: "" })
  const setTr = (l: string, patch: Partial<{ title: string; short_description: string }>) => {
    if (l === defaultLang) {
      if (patch.title !== undefined) set("title", patch.title)
      if (patch.short_description !== undefined) set("short", patch.short_description)
    } else setF((cur) => ({ ...cur, translations: { ...cur.translations, [l]: { ...(cur.translations[l] ?? { title: "", short_description: "" }), ...patch } } }))
  }
  const filled = Object.fromEntries(languages.map((l) => [l, Boolean(tr(l).title.trim())]))

  function body(publish: boolean) {
    const translations: Record<string, { title: string; short_description: string }> = {}
    for (const l of languages) if (l !== defaultLang && (f.translations[l]?.title?.trim() || f.translations[l]?.short_description?.trim())) translations[l] = f.translations[l]
    return {
      title: f.title.trim(),
      short_description: f.short.trim() || null,
      pricing_type: f.pricing,
      ...(f.pricing === "hourly" ? { hourly_rate: amountNum, hourly_currency: f.currency } : { fixed_amount: amountNum, fixed_currency: f.currency }),
      default_duration_minutes: f.duration,
      min_session_minutes: f.pricing === "hourly" ? f.minSession : null,
      max_session_minutes: f.pricing === "hourly" ? f.maxSession : null,
      fulfillment_type: f.fulfillment,
      meeting_instructions: f.instructions.trim(),
      booking_lead_minutes: f.lead,
      payment_cutoff_minutes: f.cutoff,
      timezone: f.timezone,
      translations,
      is_published: publish,
    }
  }

  async function save(publish: boolean) {
    setSubmitted(true)
    if (publish) setPublishTried(true)
    setError(null)
    if (Object.values(errs).some(Boolean)) return
    if (publish && instructionsMissing) return
    setBusy(publish ? "publish" : "draft")
    try {
      const res = savedId
        ? await api<{ service: ExpertService }>(`/api/merchant/expert/services/${savedId}`, { method: "PATCH", json: body(publish) })
        : await api<{ service: ExpertService }>("/api/merchant/expert/services", { method: "POST", json: body(publish) })
      invalidate("expert/")
      startRef.current = f
      setPublished(res.service.is_published)
      toast.show(publish ? t("expert.form.toast.published") : t("expert.form.toast.saved"))
      if (!savedId) {
        setSavedId(res.service.id)
        router.replace(`/services/${res.service.id}`)
      } else setF((c) => ({ ...c }))
    } catch (e) {
      setError(errText(e))
      window.scrollTo({ top: 0, behavior: "smooth" })
    } finally {
      setBusy(null)
    }
  }

  async function unpublish() {
    if (!savedId) return
    setBusy("unpublish")
    setError(null)
    try {
      await api(`/api/merchant/expert/services/${savedId}`, { method: "DELETE" })
      invalidate("expert/")
      setPublished(false)
      setConfirm(false)
      toast.show(t("expert.form.toast.unpublished"))
    } catch (e) {
      setConfirm(false)
      setError(errText(e))
      window.scrollTo({ top: 0, behavior: "smooth" })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="pb-28">
      <PageHeader
        back={<Link href="/services" className="inline-flex h-12 items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="size-4" />{t("expert.services.title")}</Link>}
        title={service || savedId ? t("expert.form.edit") : t("expert.form.new")}
        action={savedId ? <StatusBadge status={published ? "live" : "draft"} label={published ? t("status.live") : t("status.draft")} /> : undefined}
      />

      <div className="mx-auto max-w-2xl space-y-4">
        {error ? <Banner tone="destructive" title={error} /> : null}
        {!live ? <Banner tone="warning" title={t("expert.form.notlive.title")}>{t("errors.MERCHANT_NOT_LIVE")}</Banner> : null}
        {service?.review_status === "rejected" ? <Banner tone="destructive" title={t("expert.form.rejected")} /> : service?.review_status === "pending" ? <Banner tone="neutral" title={t("expert.form.review")} /> : null}

        <Card>
          <CardHeader title={t("expert.form.basics")} description={t("expert.form.basics.hint")} />
          <CardBody className="space-y-4">
            <LanguageTabs languages={languages} defaultLanguage={defaultLang} active={lang} onChange={setLang} filled={filled} />
            <Field key={`t-${lang}`} label={t("expert.form.title")} required={lang === defaultLang} error={lang === defaultLang ? show("title") : null}>
              <Input value={tr(lang).title} onChange={(e) => setTr(lang, { title: e.target.value })} maxLength={200} placeholder={t("expert.form.title.ph")} />
            </Field>
            <Field key={`s-${lang}`} label={t("expert.form.short")} hint={lang === defaultLang ? undefined : t("expert.form.lang.hint")}>
              <Textarea rows={3} value={tr(lang).short_description} onChange={(e) => setTr(lang, { short_description: e.target.value })} maxLength={1000} />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t("expert.form.pricing")} />
          <CardBody className="space-y-4">
            <Field label={t("expert.form.pricing.type")}>
              <Select value={f.pricing} onChange={(e) => set("pricing", e.target.value as "hourly" | "fixed")}>
                <option value="hourly">{t("expert.pricing.hourly")}</option>
                <option value="fixed">{t("expert.pricing.fixed")}</option>
              </Select>
            </Field>
            <div className="grid grid-cols-[1fr_7rem] gap-2">
              <Field label={f.pricing === "hourly" ? t("expert.form.rate") : t("expert.form.price")} required error={show("amount")}>
                <Input inputMode="decimal" value={f.amount} onChange={(e) => set("amount", e.target.value)} />
              </Field>
              <Field label={t("expert.form.currency")}>
                <Select value={f.currency} onChange={(e) => set("currency", e.target.value)}>{currencies.map((c) => <option key={c} value={c}>{c}</option>)}</Select>
              </Field>
            </div>
            <p className="text-sm text-muted">{t("expert.form.quote.note")}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t("expert.form.duration")} />
          <CardBody className="space-y-4">
            <Field label={t("expert.form.duration.default")} hint={f.duration ? formatDuration(f.duration, { h: t("expert.unit.h"), min: t("expert.unit.min") }) : undefined} error={show("duration")}>
              <UnitInput value={f.duration} onChange={(v) => set("duration", v)} />
            </Field>
            {f.pricing === "hourly" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("expert.form.duration.min")} hint={t("expert.form.optional")} error={show("range")}>
                  <UnitInput allowEmpty value={f.minSession} onChange={(v) => set("minSession", v)} />
                </Field>
                <Field label={t("expert.form.duration.max")} hint={t("expert.form.optional")}>
                  <UnitInput allowEmpty value={f.maxSession} onChange={(v) => set("maxSession", v)} />
                </Field>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t("expert.form.delivery")} />
          <CardBody className="space-y-4">
            <Field label={t("expert.form.delivery.mode")}>
              <Select value={f.fulfillment} onChange={(e) => set("fulfillment", e.target.value as FormState["fulfillment"])}>
                {(Object.keys(FULFILLMENT_KEYS) as Array<keyof typeof FULFILLMENT_KEYS>).map((k) => <option key={k} value={k}>{t(FULFILLMENT_KEYS[k])}</option>)}
              </Select>
            </Field>
            <Field label={t("expert.form.instructions")} hint={t("expert.form.instructions.hint")} error={publishTried ? instructionsMissing : null}>
              <Textarea rows={4} value={f.instructions} onChange={(e) => set("instructions", e.target.value)} maxLength={2000} />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t("expert.form.rules")} />
          <CardBody className="space-y-4">
            <Field label={t("expert.form.lead")} hint={t("expert.form.lead.hint")} error={show("lead")}>
              <UnitInput value={f.lead} onChange={(v) => set("lead", v)} />
            </Field>
            <Field label={t("expert.form.cutoff")} hint={t("expert.form.cutoff.hint")} error={show("cutoff")}>
              <UnitInput value={f.cutoff} onChange={(v) => set("cutoff", v)} />
            </Field>
            <Field label={t("expert.form.timezone")} hint={t("expert.form.timezone.hint")}>
              <Select value={f.timezone} onChange={(e) => set("timezone", e.target.value)}>{zones.map((z) => <option key={z} value={z}>{z}</option>)}</Select>
            </Field>
          </CardBody>
        </Card>

        {savedId && published ? (
          <Card>
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{t("expert.form.unpublish.title")}</p>
                <p className="text-sm text-muted">{t("expert.form.unpublish.body")}</p>
              </div>
              <Button variant="secondary" onClick={() => setConfirm(true)}>{t("expert.form.unpublish.action")}</Button>
            </CardBody>
          </Card>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-hairline bg-white/95 px-4 py-3 backdrop-blur md:bottom-0 md:left-[248px]">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <p className="hidden min-w-0 flex-1 truncate text-sm text-muted sm:block" aria-live="polite">{dirty ? t("expert.form.unsaved") : savedId ? t("state.saved") : ""}</p>
          <Button variant="secondary" className="ml-auto flex-1 sm:flex-none" onClick={() => save(published)} busy={busy === "draft"} disabled={busy !== null || (!dirty && Boolean(savedId))}>
            {published ? t("action.save") : t("expert.form.save_draft")}
          </Button>
          {!published ? (
            <Button className="flex-1 sm:flex-none" onClick={() => save(true)} busy={busy === "publish"} disabled={busy !== null || !live}>
              {t("expert.form.publish")}
            </Button>
          ) : null}
        </div>
      </div>

      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title={t("expert.form.unpublish.confirm")} description={t("expert.form.unpublish.confirm.body")} confirmLabel={t("expert.form.unpublish.action")} cancelLabel={t("action.cancel")} destructive busy={busy === "unpublish"} onConfirm={unpublish} />
    </div>
  )
}
