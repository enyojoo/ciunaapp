"use client"
import * as React from "react"
import { Banner, Button, Field, Input, Select, Sheet, useToast } from "@ciuna/ui-web"
import { api, ApiError } from "@/lib/api"
import { useErrorText, useT } from "@/lib/i18n"
import { KIND_FIELDS, validateMethodForm, type MethodKind } from "./logic"

const CURRENCIES = ["RUB", "USD", "EUR", "GBP", "CNY", "AED", "KZT"]
const LABELS: Record<string, string> = { phone: "earnings.field.phone", bank_name: "earnings.field.bank_name", recipient_name: "earnings.field.recipient_name", account_number: "earnings.field.account_number", bik: "earnings.field.bik", swift: "earnings.field.swift", iban: "earnings.field.iban", country: "earnings.field.country" }

export function AddMethodSheet({ open, onOpenChange, defaultCurrency, onAdded }: { open: boolean; onOpenChange: (o: boolean) => void; defaultCurrency: string; onAdded: () => void }) {
  const { t } = useT()
  const errText = useErrorText()
  const toast = useToast()
  const [kind, setKind] = React.useState<MethodKind>("bank")
  const [currency, setCurrency] = React.useState(defaultCurrency || "USD")
  const [label, setLabel] = React.useState("")
  const [details, setDetails] = React.useState<Record<string, string>>({})
  const [fieldError, setFieldError] = React.useState<{ code: string; field?: string } | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return
    setKind("bank"); setCurrency(defaultCurrency || "USD"); setLabel(""); setDetails({}); setFieldError(null); setError(null)
  }, [open, defaultCurrency])

  const spec = KIND_FIELDS[kind]
  const currencies = spec.currencies ?? (CURRENCIES.includes(currency) ? CURRENCIES : [currency, ...CURRENCIES])
  const set = (k: string, v: string) => { setDetails((d) => ({ ...d, [k]: v })); setFieldError(null) }
  const errFor = (f: string) => (fieldError?.field === f ? (fieldError.code === "FIELD_REQUIRED" ? t("state.required") : errText(fieldError.code)) : null)

  function pickKind(k: MethodKind) {
    setKind(k); setFieldError(null)
    const only = KIND_FIELDS[k].currencies
    if (only && !only.includes(currency)) setCurrency(only[0])
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const bad = validateMethodForm(kind, currency, details)
    if (bad) { setFieldError(bad); return }
    setBusy(true); setError(null)
    try {
      const clean: Record<string, string> = {}
      for (const f of [...spec.required, ...spec.optional]) if (details[f]?.trim()) clean[f] = details[f].trim()
      await api("/api/merchant/payout-methods", { method: "POST", json: { kind, currency, label: label.trim(), details: clean } })
      toast.show(t("earnings.methods.added"))
      onOpenChange(false)
      onAdded()
    } catch (err) {
      if (err instanceof ApiError && err.code === "FIELD_REQUIRED" && err.details?.field) setFieldError({ code: "FIELD_REQUIRED", field: err.details.field })
      else setError(errText(err instanceof ApiError ? err.code : undefined))
    } finally { setBusy(false) }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("earnings.methods.add")}
      description={t("earnings.methods.verify.body")}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>{t("action.cancel")}</Button>
          <Button type="submit" form="add-method-form" busy={busy}>{t("earnings.methods.add.cta")}</Button>
        </>
      }
    >
      <form id="add-method-form" onSubmit={submit} noValidate className="space-y-4">
        <Field label={t("earnings.methods.kind")}>
          <Select value={kind} onChange={(e) => pickKind(e.target.value as MethodKind)}>
            <option value="bank">{t("earnings.kind.bank")}</option>
            <option value="sbp">{t("earnings.kind.sbp")}</option>
            <option value="ciuna_send" disabled>{t("earnings.kind.ciuna_send")} ({t("earnings.comingSoon")})</option>
          </Select>
        </Field>
        <Field label={t("earnings.methods.currency")} error={errFor("currency")} hint={kind === "sbp" ? t("earnings.methods.sbp.rubOnly") : undefined}>
          <Select value={currency} onChange={(e) => { setCurrency(e.target.value); setFieldError(null) }} disabled={Boolean(spec.currencies && spec.currencies.length === 1)}>
            {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label={t("earnings.methods.label")} hint={t("earnings.methods.label.hint")}><Input maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)} /></Field>
        {spec.required.map((f) => (
          <Field key={f} label={t(LABELS[f])} required error={errFor(f)}>
            <Input value={details[f] ?? ""} maxLength={120} inputMode={f === "phone" ? "tel" : undefined} autoComplete="off" placeholder={f === "phone" ? "+7 900 123 45 67" : undefined} onChange={(e) => set(f, e.target.value)} />
          </Field>
        ))}
        {spec.optional.map((f) => (
          <Field key={f} label={t(LABELS[f])}><Input value={details[f] ?? ""} maxLength={120} autoComplete="off" onChange={(e) => set(f, e.target.value)} /></Field>
        ))}
        <p className="text-sm text-muted">{t("earnings.methods.privacy")}</p>
        {error ? <Banner tone="destructive" title={error} /> : null}
      </form>
    </Sheet>
  )
}
