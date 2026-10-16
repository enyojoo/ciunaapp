"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { Store, Briefcase } from "lucide-react"
import { BrandLogo } from "@ciuna/shared"
import { Button, Card, Field, Input, Select, Banner, LANGUAGE_LABELS, cn } from "@ciuna/ui-web"
import { api, ApiError } from "@/lib/api"
import { useSeller } from "@/lib/session"
import { useErrorText, useT, LOCALE_LIST } from "@/lib/i18n"
import { countryOptions } from "@/lib/countries"

export default function OnboardingPage() {
  const { t, locale } = useT()
  const errText = useErrorText()
  const router = useRouter()
  const { ready, session, me, refresh } = useSeller()
  const [type, setType] = React.useState<"store" | "expert" | null>(null)
  const [line, setLine] = React.useState<"food" | "mart">("food")
  const [name, setName] = React.useState("")
  const [country, setCountry] = React.useState("RU")
  const [operating, setOperating] = React.useState("RU")
  const [languages, setLanguages] = React.useState<string[]>([locale])
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const countries = React.useMemo(() => countryOptions(locale), [locale])

  React.useEffect(() => { if (ready && !session) router.replace("/login?next=/onboarding") }, [ready, session, router])

  const toggle = (l: string) => setLanguages((cur) => (cur.includes(l) ? (cur.length > 1 ? cur.filter((x) => x !== l) : cur) : [...cur, l]))

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!type) return
    setBusy(true)
    setError(null)
    try {
      await api("/api/merchant/merchants", { method: "POST", merchantId: null, json: { type, displayName: name, country, operatingCountry: operating, languages, line: type === "store" ? line : undefined } })
      await refresh()
      router.replace("/setup")
    } catch (err) {
      setError(errText(err instanceof ApiError ? err.code : undefined))
      setBusy(false)
    }
  }

  async function accept(token: string) {
    setBusy(true)
    try {
      await api("/api/merchant/invites/accept", { method: "POST", merchantId: null, json: { token } })
      await refresh()
      router.replace("/")
    } catch (err) {
      setError(errText(err instanceof ApiError ? err.code : undefined))
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-10 pt-6 pt-safe">
      <div className="mb-8"><BrandLogo size="lg" /></div>
      <h1 className="text-2xl font-bold tracking-tight">{t("onb.title")}</h1>
      <p className="mt-1.5 text-[15px] text-muted">{t("onb.subtitle")}</p>

      {me?.invites?.length ? (
        <div className="mt-6 space-y-2">
          {me.invites.map((inv) => (
            <Banner key={inv.id} tone="neutral" title={t("onb.invite", { name: inv.merchants.display_name })} action={<Button size="sm" onClick={() => accept(inv.token)} busy={busy}>{t("onb.invite.accept")}</Button>}>
              {t(`role.${inv.role}`)}
            </Banner>
          ))}
        </div>
      ) : null}

      <form onSubmit={create} className="mt-6 space-y-6" noValidate>
        {error ? <Banner tone="destructive" title={error} /> : null}
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">{t("onb.type")}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {([["store", Store], ["expert", Briefcase]] as const).map(([k, Icon]) => (
              <button key={k} type="button" onClick={() => setType(k)} aria-pressed={type === k} className={cn("rounded-2xl border p-4 text-left outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50", type === k ? "border-primary-border bg-primary-tint" : "border-hairline bg-white hover:border-input-edge")}>
                <Icon className="mb-3 size-6 text-primary-text" aria-hidden />
                <span className="block font-semibold">{t(`onb.type.${k}`)}</span>
                <span className="mt-0.5 block text-sm text-muted">{t(`onb.type.${k}.body`)}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {type ? (
          <Card className="space-y-4 p-4 sm:p-5">
            <Field label={t(type === "store" ? "onb.name.store" : "onb.name.expert")} required><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="organization" /></Field>
            {type === "store" ? (
              <Field label={t("onb.line")} hint={t("onb.line.hint")}>
                <Select value={line} onChange={(e) => setLine(e.target.value as any)}>
                  <option value="food">{t("onb.line.food")}</option>
                  <option value="mart">{t("onb.line.mart")}</option>
                </Select>
              </Field>
            ) : null}
            <Field label={t("onb.country")} hint={t("onb.country.hint")}>
              <Select value={country} onChange={(e) => setCountry(e.target.value)}>{countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</Select>
            </Field>
            <Field label={t("onb.operating")} hint={t("onb.operating.hint")}>
              <Select value={operating} onChange={(e) => setOperating(e.target.value)}>{countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</Select>
            </Field>
            <fieldset>
              <legend className="mb-1.5 text-sm font-semibold">{t("onb.languages")}</legend>
              <p className="mb-2 text-sm text-muted">{t("onb.languages.hint")}</p>
              <div className="flex flex-wrap gap-2">
                {LOCALE_LIST.map((l) => (
                  <button key={l} type="button" aria-pressed={languages.includes(l)} onClick={() => toggle(l)} className={cn("h-10 rounded-full border px-4 text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50", languages.includes(l) ? "border-primary bg-primary text-primary-foreground" : "border-input-edge bg-white")}>
                    {LANGUAGE_LABELS[l]}
                  </button>
                ))}
              </div>
            </fieldset>
          </Card>
        ) : null}

        <Button type="submit" size="lg" className="w-full" busy={busy} disabled={!type || name.trim().length < 2}>{t("action.continue")}</Button>
      </form>
    </main>
  )
}
