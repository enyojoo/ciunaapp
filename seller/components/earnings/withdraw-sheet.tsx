"use client"
import * as React from "react"
import Link from "next/link"
import { Amount, Banner, Button, Field, Input, Select, Sheet, useToast } from "@ciuna/ui-web"
import { api, ApiError } from "@/lib/api"
import { invalidate, useQuery } from "@/lib/query"
import { useErrorText, useT } from "@/lib/i18n"
import { amountToInput, debounce, methodsForCurrency, validateAmount, type Balance, type PayoutMethod } from "./logic"

interface Preview { fee: number; net: number; min: number }

export function WithdrawSheet({ open, onOpenChange, balances, minPayout, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; balances: Balance[]; minPayout: Record<string, number>; onDone: () => void }) {
  const { t } = useT()
  const errText = useErrorText()
  const toast = useToast()
  const methods = useQuery<{ methods: PayoutMethod[] }>(open ? "payout-methods" : null, () => api("/api/merchant/payout-methods"))
  const [currency, setCurrency] = React.useState("")
  const [methodId, setMethodId] = React.useState("")
  const [raw, setRaw] = React.useState("")
  const [preview, setPreview] = React.useState<Preview | null>(null)
  const [previewError, setPreviewError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [touched, setTouched] = React.useState(false)

  const balance = balances.find((b) => b.currency === currency)
  const available = balance?.available ?? 0
  const min = minPayout[currency] ?? 0
  const { verified, unverified } = methodsForCurrency(methods.data?.methods, currency)
  const check = validateAmount(raw, available, min)

  // reset each time the sheet opens, picking the currency with the most available money
  React.useEffect(() => {
    if (!open) return
    const first = balances.find((b) => b.available > 0) ?? balances[0]
    setCurrency(first?.currency ?? "")
    setRaw(""); setPreview(null); setPreviewError(null); setError(null); setTouched(false)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // keep the chosen method valid for the chosen currency
  React.useEffect(() => {
    if (!verified.some((m) => m.id === methodId)) setMethodId(verified[0]?.id ?? "")
  }, [currency, methods.data]) // eslint-disable-line react-hooks/exhaustive-deps

  const seq = React.useRef(0)
  const fetchPreview = React.useMemo(() => debounce(async (amount: number, cur: string) => {
    const id = ++seq.current
    try {
      const res = await api<Preview>("/api/merchant/payouts", { method: "POST", json: { preview: true, amount, currency: cur } })
      if (id === seq.current) { setPreview(res); setPreviewError(null) }
    } catch (e) {
      if (id === seq.current) { setPreview(null); setPreviewError(errText(e instanceof ApiError ? e.code : undefined)) }
    }
  }, 350), []) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!open) return
    if (check.amount !== null && !check.error) fetchPreview(check.amount, currency)
    else { fetchPreview.cancel(); seq.current++; setPreview(null); setPreviewError(null) }
    return () => fetchPreview.cancel()
  }, [open, check.amount, check.error, currency, fetchPreview])

  const amountError = touched && check.error ? errText(check.error) : null
  const canSubmit = !check.error && check.amount !== null && Boolean(methodId) && preview !== null

  async function submit() {
    if (!canSubmit || check.amount === null) return
    setBusy(true); setError(null)
    try {
      await api("/api/merchant/payouts", { method: "POST", json: { amount: check.amount, currency, methodId } })
      invalidate("earnings"); invalidate("payouts")
      toast.show(t("earnings.withdraw.success"))
      onOpenChange(false)
      onDone()
    } catch (e) { setError(errText(e instanceof ApiError ? e.code : undefined)) } finally { setBusy(false) }
  }

  const noMethods = methods.data && verified.length === 0

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("earnings.withdraw")}
      description={t("earnings.withdraw.timing")}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>{t("action.cancel")}</Button>
          <Button onClick={submit} busy={busy} disabled={!canSubmit}>{t("earnings.withdraw.cta")}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {balances.length > 1 ? (
          <Field label={t("earnings.withdraw.currency")}>
            <Select value={currency} onChange={(e) => { setCurrency(e.target.value); setRaw(""); setTouched(false) }}>
              {balances.map((b) => <option key={b.currency} value={b.currency}>{b.currency}</option>)}
            </Select>
          </Field>
        ) : null}

        <Field label={t("earnings.withdraw.method")}>
          <Select value={methodId} onChange={(e) => setMethodId(e.target.value)} disabled={verified.length === 0}>
            {verified.length === 0 ? <option value="">{t("earnings.withdraw.noMethod")}</option> : null}
            {verified.map((m) => <option key={m.id} value={m.id}>{m.label}{m.last4 ? ` ••${m.last4}` : ""}</option>)}
          </Select>
        </Field>
        {noMethods ? (
          <Banner tone="warning" title={unverified.length ? t("earnings.withdraw.unverified.title") : t("earnings.withdraw.none.title", { currency })} action={<Link href="/earnings/methods" className="text-sm font-semibold underline">{t("earnings.methods.manage")}</Link>}>
            {unverified.length ? t("earnings.withdraw.unverified.body", { names: unverified.map((m) => m.label).join(", ") }) : t("earnings.withdraw.none.body")}
          </Banner>
        ) : unverified.length ? (
          <p className="text-sm text-muted">{t("earnings.withdraw.unverified.note", { names: unverified.map((m) => m.label).join(", ") })}</p>
        ) : null}

        <Field label={t("earnings.withdraw.amount")} error={amountError}>
          <div className="flex gap-2">
            <Input inputMode="decimal" autoComplete="off" placeholder="0.00" value={raw} onChange={(e) => { setRaw(e.target.value); setTouched(true) }} onBlur={() => setTouched(true)} />
            <Button type="button" variant="secondary" className="h-11 px-4" onClick={() => { setRaw(amountToInput(available)); setTouched(true) }} disabled={available <= 0}>{t("earnings.withdraw.all")}</Button>
          </div>
        </Field>
        <p className="-mt-2 text-sm text-muted">
          {t("earnings.withdraw.available")} <Amount value={available} currency={currency} />
          {min ? <> · {t("earnings.withdraw.min")} <Amount value={min} currency={currency} /></> : null}
        </p>

        {previewError ? <Banner tone="destructive" title={previewError} /> : null}
        {preview && check.amount !== null ? (
          <dl className="space-y-2 rounded-2xl bg-neutral-surface p-4 text-[15px]">
            <div className="flex justify-between gap-3"><dt className="text-muted">{t("earnings.withdraw.requested")}</dt><dd><Amount value={check.amount} currency={currency} /></dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">{t("earnings.withdraw.fee")}</dt><dd><Amount value={preview.fee} currency={currency} /></dd></div>
            <div className="flex items-baseline justify-between gap-3 border-t border-hairline pt-2"><dt className="font-semibold">{t("earnings.withdraw.receive")}</dt><dd><Amount value={preview.net} currency={currency} size="large" /></dd></div>
          </dl>
        ) : null}
        {error ? <Banner tone="destructive" title={error} /> : null}
      </div>
    </Sheet>
  )
}
