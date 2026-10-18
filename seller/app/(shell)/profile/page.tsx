"use client"
import * as React from "react"
import { COMMUNITY_IDS, MAX_STORE_COMMUNITIES } from "@ciuna/shared"
import { Button, Card, CardBody, CardHeader, Chip, Field, Input, LanguageTabs, PageHeader, Select, Textarea, useToast, Banner } from "@ciuna/ui-web"
import { RequirePermission } from "@/components/no-access"
import { api, ApiError } from "@/lib/api"
import { useSeller } from "@/lib/session"
import { useErrorText, useT } from "@/lib/i18n"
import { ImageUpload } from "@/components/image-upload"
import { countryOptions } from "@/lib/countries"
import { CredentialsCard } from "@/components/expert/credentials-card"

const CURRENCIES = ["RUB", "USD", "EUR", "CNY", "NGN", "GHS", "KES", "BRL"]

export default function ProfilePage() {
  return <RequirePermission permission="profile"><ProfilePageContent /></RequirePermission>
}

function ProfilePageContent() {
  const { merchant, refresh, can } = useSeller()
  const { t, locale } = useT()
  const errText = useErrorText()
  const toast = useToast()
  const [f, setF] = React.useState(() => seed(merchant))
  const [lang, setLang] = React.useState(merchant?.default_language || "en")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const countries = React.useMemo(() => countryOptions(locale), [locale])
  const dirty = React.useRef(false)

  React.useEffect(() => { if (merchant && !dirty.current) setF(seed(merchant)) }, [merchant])
  React.useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty.current) e.preventDefault() }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [])
  if (!merchant) return null
  const editable = can("profile") && merchant.status !== "suspended"
  const set = (patch: Partial<typeof f>) => { dirty.current = true; setF((p) => ({ ...p, ...patch })) }

  async function save() {
    setBusy(true); setError(null)
    try {
      await api("/api/merchant/profile", { method: "PATCH", json: { display_name: f.display_name, description: f.description, contact_email: f.contact_email, contact_phone: f.contact_phone, website: f.website, logo_url: f.logo_url, cover_url: f.cover_url, default_currency: f.default_currency, operating_country: f.operating_country, country: f.country, ...(merchant?.type === "store" ? { communities: f.communities } : {}) } })
      dirty.current = false
      await refresh(); toast.show(t("state.saved"))
    } catch (e) { setError(errText(e instanceof ApiError ? e.code : undefined)) } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader title={t(merchant.type === "store" ? "more.storeProfile" : "more.expertProfile")} description={t("profile.subtitle")} />
      {error ? <div className="mb-4"><Banner tone="destructive" title={error} /></div> : null}
      <div className="space-y-4 pb-24 md:pb-0">
        <Card>
          <CardHeader title={t("profile.basics")} />
          <CardBody className="space-y-4">
            <Field label={t(merchant.type === "store" ? "onb.name.store" : "onb.name.expert")} required><Input disabled={!editable} value={f.display_name} maxLength={80} onChange={(e) => set({ display_name: e.target.value })} /></Field>
            <div>
              <LanguageTabs languages={merchant.languages} defaultLanguage={merchant.default_language} active={lang} onChange={setLang} filled={Object.fromEntries(merchant.languages.map((l) => [l, Boolean(f.description[l])]))} />
              <Field className="mt-3" label={t("profile.description")} hint={t("profile.description.hint")}>
                <Textarea disabled={!editable} rows={5} maxLength={2000} value={f.description[lang] || ""} onChange={(e) => set({ description: { ...f.description, [lang]: e.target.value } })} />
              </Field>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t("profile.images")} />
          <CardBody className="grid gap-4 sm:grid-cols-[200px_1fr]">
            <ImageUpload aspect="aspect-square" folder="logo" label={t("setup.logo.upload")} value={f.logo_url} onChange={(u) => set({ logo_url: u })} />
            <ImageUpload aspect="aspect-[16/6]" folder="cover" label={t("profile.cover.upload")} value={f.cover_url} onChange={(u) => set({ cover_url: u })} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t("profile.contact")} />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label={t("auth.email")}><Input type="email" disabled={!editable} value={f.contact_email} onChange={(e) => set({ contact_email: e.target.value })} /></Field>
            <Field label={t("profile.phone")}><Input type="tel" disabled={!editable} value={f.contact_phone} onChange={(e) => set({ contact_phone: e.target.value })} /></Field>
            <Field label={t("profile.website")} hint="https://"><Input disabled={!editable} value={f.website} onChange={(e) => set({ website: e.target.value })} /></Field>
            <Field label={t("profile.currency")}><Select disabled={!editable} value={f.default_currency} onChange={(e) => set({ default_currency: e.target.value })}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
            <Field label={t("onb.country")}><Select disabled={!editable} value={f.country} onChange={(e) => set({ country: e.target.value })}>{countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</Select></Field>
            <Field label={t("onb.operating")}><Select disabled={!editable} value={f.operating_country} onChange={(e) => set({ operating_country: e.target.value })}>{countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</Select></Field>
          </CardBody>
        </Card>
        {merchant.type === "store" ? (
          <Card>
            <CardHeader title={t("profile.communities")} />
            <CardBody className="space-y-3">
              <p className="text-sm text-muted">{t("profile.communities.hint", { max: MAX_STORE_COMMUNITIES })}</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t("profile.communities")}>
                {COMMUNITY_IDS.map((id) => {
                  const on = f.communities.includes(id)
                  const full = !on && f.communities.length >= MAX_STORE_COMMUNITIES
                  return (
                    <span key={id} className={editable && !full ? undefined : "pointer-events-none opacity-50"}>
                      <Chip selected={on} onClick={() => set({ communities: on ? f.communities.filter((c) => c !== id) : [...f.communities, id] })}>{t(`community.${id}`)}</Chip>
                    </span>
                  )
                })}
              </div>
              <p className="text-xs text-muted">{t("profile.communities.count", { n: f.communities.length, max: MAX_STORE_COMMUNITIES })}</p>
            </CardBody>
          </Card>
        ) : null}
        {merchant.type === "expert" ? <CredentialsCard editable={editable} /> : null}
      </div>
      {editable ? (
        <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 border-t border-hairline bg-white/95 p-3 backdrop-blur md:static md:mt-4 md:border-0 md:bg-transparent md:p-0">
          <Button size="lg" className="w-full md:w-auto" onClick={save} busy={busy}>{t("action.save")}</Button>
        </div>
      ) : null}
    </>
  )
}

function seed(m: ReturnType<typeof useSeller>["merchant"]) {
  return {
    display_name: m?.display_name || "",
    description: (m?.description || {}) as Record<string, string>,
    contact_email: m?.contact_email || "",
    contact_phone: m?.contact_phone || "",
    website: m?.website || "",
    logo_url: m?.logo_url ?? null,
    cover_url: m?.cover_url ?? null,
    default_currency: m?.default_currency || "RUB",
    country: m?.country || "RU",
    operating_country: m?.operating_country || "RU",
    communities: (m?.communities || []) as string[],
  }
}
