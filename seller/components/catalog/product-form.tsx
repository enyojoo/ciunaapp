"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Archive, Bike, Store, Download } from "lucide-react"
import { Banner, Button, Card, StatusBadge, CardBody, CardHeader, ConfirmDialog, Field, Input, LanguageTabs, Select, Switch, Textarea, cn, useToast } from "@ciuna/ui-web"
import { api, ApiError } from "@/lib/api"
import { invalidate, useQuery } from "@/lib/query"
import { useSeller } from "@/lib/session"
import { useErrorText, useT } from "@/lib/i18n"
import { ImageUpload } from "@/components/image-upload"
import { CURRENCIES } from "./csv"
import { categoriesFor, num, PRODUCTS_KEY, type FulfillmentData, type Product } from "./shared"

type Tr = { title: string; short: string; long: string }
interface FormState {
  title: string
  short: string
  long: string
  category: string
  image: string | null
  gallery: string[]
  list: string
  sale: string
  currency: string
  unlimited: boolean
  stock: string
  soldOut: boolean
  /** Visibility card: on means the listing is live in the store. */
  visible: boolean
  mode: "delivery" | "pickup" | "digital"
  tr: Record<string, Tr>
}
type Errs = Partial<Record<"title" | "list" | "sale" | "stock", string>>

const ctl = "h-12 md:h-11"
const priceText = (v: number | string | null | undefined) => (v === null || v === undefined || v === "" ? "" : String(Number(v)))

function initial(p: Product | null, currency: string, category: string, canPublish: boolean): FormState {
  const tr: Record<string, Tr> = {}
  for (const [l, v] of Object.entries(p?.translations ?? {})) tr[l] = { title: v?.title ?? "", short: v?.short_description ?? "", long: v?.long_description ?? "" }
  return {
    title: p?.title ?? "",
    short: p?.short_description ?? "",
    long: p?.long_description ?? "",
    category: p?.category ?? category,
    image: p?.image_url ?? null,
    gallery: p?.gallery ?? [],
    list: priceText(p?.list_price),
    sale: priceText(p?.sale_price),
    currency: p?.fixed_currency ?? currency,
    unlimited: p ? p.stock_quantity === null : true,
    stock: p?.stock_quantity != null ? String(p.stock_quantity) : "",
    soldOut: p?.sold_out ?? false,
    visible: p ? p.status === "live" : canPublish,
    mode: p?.fulfillment_mode ?? "delivery",
    tr,
  }
}

export function ProductForm({ product }: { product: Product | null }) {
  const { t } = useT()
  const errText = useErrorText()
  const router = useRouter()
  const toast = useToast()
  const { merchant } = useSeller()
  const defaultLang = merchant?.default_language ?? "en"
  const languages = React.useMemo(() => {
    const list = merchant?.languages?.length ? merchant.languages : [defaultLang]
    return list.includes(defaultLang) ? [defaultLang, ...list.filter((l) => l !== defaultLang)] : [defaultLang, ...list]
  }, [merchant?.languages, defaultLang])
  const categories = categoriesFor(merchant?.service_line)
  const currency = merchant?.default_currency ?? "USD"

  const [form, setForm] = React.useState<FormState>(() => initial(product, currency, categories[0] ?? "", merchant?.status === "live"))
  const [saved, setSaved] = React.useState(() => JSON.stringify(form))
  const [current, setCurrent] = React.useState<Product | null>(product)
  const [lang, setLang] = React.useState(defaultLang)
  const [errs, setErrs] = React.useState<Errs>({})
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState<"draft" | "live" | null>(null)
  const [archiveOpen, setArchiveOpen] = React.useState(false)
  const [archiving, setArchiving] = React.useState(false)

  // The session may arrive after first paint: fill in the default category and currency for new products.
  React.useEffect(() => {
    if (current) return
    setForm((f) => {
      const next = { ...f, category: f.category || categories[0] || "", currency: f.currency || currency }
      setSaved((s) => (s === JSON.stringify(f) ? JSON.stringify(next) : s))
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant?.id, merchant?.service_line])

  const dirty = JSON.stringify(form) !== saved
  React.useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = "" }
    window.addEventListener("beforeunload", h)
    return () => window.removeEventListener("beforeunload", h)
  }, [dirty])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))
  const isDefault = lang === defaultLang
  const trOf = (l: string): Tr => form.tr[l] ?? { title: "", short: "", long: "" }
  const setTr = (k: keyof Tr, v: string) => setForm((f) => ({ ...f, tr: { ...f.tr, [lang]: { ...(f.tr[lang] ?? { title: "", short: "", long: "" }), [k]: v } } }))
  const view = isDefault ? { title: form.title, short: form.short, long: form.long } : trOf(lang)
  const edit = (k: keyof Tr, v: string) => (isDefault ? set(k, v) : setTr(k, v))
  const filled = Object.fromEntries(languages.map((l) => [l, l === defaultLang ? form.title.trim().length > 0 : Boolean(form.tr[l]?.title?.trim())]))

  const needsFulfillment = form.mode !== "digital"
  const ful = useQuery<FulfillmentData>(needsFulfillment ? "fulfillment" : null, () => api<FulfillmentData>("/api/merchant/fulfillment"))
  const fulMissing = needsFulfillment && ful.data
    ? form.mode === "pickup" ? !ful.data.pickup.location : !ful.data.zones.some((z) => z.active)
    : false

  const canPublish = merchant?.status === "live"

  function validate(): Errs {
    const e: Errs = {}
    if (form.title.trim().length < 2) e.title = t("errors.TITLE_REQUIRED")
    const list = num(form.list)
    if (!(list > 0)) e.list = t("errors.PRICE_REQUIRED")
    if (form.sale.trim()) {
      const sale = num(form.sale)
      if (!(sale > 0) || (list > 0 && sale >= list)) e.sale = t("errors.SALE_PRICE_TOO_HIGH")
    }
    if (!form.unlimited) {
      const n = form.stock.trim()
      if (!/^\d+$/.test(n) || Number(n) >= 1_000_000) e.stock = t("errors.INVALID_STOCK")
    }
    return e
  }

  async function save(status: "draft" | "live") {
    setServerError(null)
    const e = validate()
    setErrs(e)
    if (Object.keys(e).length) {
      setLang(defaultLang)
      toast.show(t("catalog.form.fixErrors"), "error")
      return
    }
    const translations: Record<string, { title: string; short_description: string; long_description: string }> = {}
    for (const l of languages) {
      const v = form.tr[l]
      if (l === defaultLang || !v) continue
      if (v.title.trim() || v.short.trim() || v.long.trim()) translations[l] = { title: v.title.trim(), short_description: v.short.trim(), long_description: v.long.trim() }
    }
    const body = {
      title: form.title.trim(),
      short_description: form.short.trim(),
      long_description: form.long.trim(),
      ...(form.category ? { category: form.category } : {}),
      list_price: num(form.list),
      sale_price: form.sale.trim() ? num(form.sale) : null,
      fixed_currency: form.currency,
      stock_quantity: form.unlimited ? null : Number(form.stock),
      sold_out: form.soldOut,
      fulfillment_mode: form.mode,
      image_url: form.image,
      gallery: form.gallery,
      translations,
      status,
    }
    setBusy(status)
    try {
      const res = current
        ? await api<{ product: Product }>(`/api/merchant/products/${current.id}`, { method: "PATCH", json: body })
        : await api<{ product: Product }>("/api/merchant/products", { method: "POST", json: body })
      invalidate(PRODUCTS_KEY)
      setSaved(JSON.stringify(form))
      setCurrent(res.product)
      toast.show(status === "live" ? t("catalog.toast.published") : t("catalog.toast.savedDraft"))
      // Let the saved-state commit before navigating so the unload guard stays quiet.
      setTimeout(() => router.push("/catalog"), 0)
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined
      setServerError(errText(code))
    } finally {
      setBusy(null)
    }
  }

  async function archive() {
    if (!current) return
    setArchiving(true)
    try {
      await api(`/api/merchant/products/${current.id}`, { method: "DELETE" })
      invalidate(PRODUCTS_KEY)
      setSaved(JSON.stringify(form))
      toast.show(t("catalog.toast.archived"))
      setTimeout(() => router.push("/catalog"), 0)
    } catch (err) {
      setArchiveOpen(false)
      setServerError(errText(err instanceof ApiError ? err.code : undefined))
    } finally {
      setArchiving(false)
    }
  }

  const addGallery = (url: string | null) => { if (url) set("gallery", [...form.gallery, url].slice(0, 8)) }
  const modes: Array<{ v: FormState["mode"]; label: string; icon: React.ReactNode }> = [
    { v: "delivery", label: t("catalog.mode.delivery"), icon: <Bike className="size-4" /> },
    { v: "pickup", label: t("catalog.mode.pickup"), icon: <Store className="size-4" /> },
    { v: "digital", label: t("catalog.mode.digital"), icon: <Download className="size-4" /> },
  ]
  const status = current?.status ?? "draft"

  return (
    <form onSubmit={(e) => { e.preventDefault(); void save(canPublish && form.visible ? "live" : "draft") }} className="space-y-4" noValidate>
      {serverError ? <Banner tone="destructive" title={serverError} /> : null}
      {current?.review_status === "rejected" ? <Banner tone="destructive" title={t("catalog.review.rejected", { note: current.review_note ?? "" })} /> : current?.review_status === "pending" ? <Banner tone="warning" title={t("catalog.review.pending")} /> : null}
      <p className="text-sm text-muted">{t("catalog.form.moderationHint")}</p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="space-y-4">
      <Card>
        <CardHeader title={t("catalog.section.basics")} />
        <CardBody className="space-y-4">
          {languages.length > 1 ? (
            <div>
              <LanguageTabs languages={languages} defaultLanguage={defaultLang} active={lang} onChange={setLang} filled={filled} />
              <p className="mt-1.5 text-sm text-muted">{isDefault ? t("catalog.lang.defaultHint") : t("catalog.lang.otherHint")}</p>
            </div>
          ) : null}
          <Field label={t("catalog.field.title")} required={isDefault} error={isDefault ? errs.title : null}>
            <Input className={ctl} value={view.title} maxLength={120} onChange={(e) => edit("title", e.target.value)} />
          </Field>
          <Field label={t("catalog.field.short")} hint={t("catalog.field.shortHint")}>
            <Input className={ctl} value={view.short} maxLength={300} onChange={(e) => edit("short", e.target.value)} />
          </Field>
          {isDefault && categories.length ? (
            <Field label={t("catalog.field.category")}>
              <Select className={ctl} value={form.category} onChange={(e) => set("category", e.target.value)}>
                {categories.map((c) => <option key={c} value={c}>{t(`catalog.cat.${c}`)}</option>)}
              </Select>
            </Field>
          ) : null}
          <Field label={t("catalog.field.long")}>
            <Textarea rows={6} value={view.long} maxLength={4000} onChange={(e) => edit("long", e.target.value)} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("catalog.section.photos")} description={t("catalog.photos.hint")} />
        <CardBody className="space-y-4">
          <div className="max-w-xs">
            <p className="mb-1.5 text-sm font-semibold text-ink">{t("catalog.photos.main")}</p>
            <ImageUpload value={form.image} onChange={(u) => set("image", u)} folder="products" label={t("catalog.photos.addMain")} aspect="aspect-square" />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink">{t("catalog.photos.gallery", { n: form.gallery.length })}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {form.gallery.map((u, i) => (
                <ImageUpload key={u + i} value={u} onChange={(nu) => set("gallery", nu ? form.gallery.map((x, j) => (j === i ? nu : x)) : form.gallery.filter((_, j) => j !== i))} folder="products" label={t("catalog.photos.addMain")} aspect="aspect-square" />
              ))}
              {form.gallery.length < 8 ? (
                <ImageUpload key={`new-${form.gallery.length}`} value={null} onChange={addGallery} folder="products" label={t("catalog.photos.add")} aspect="aspect-square" />
              ) : null}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("catalog.section.price")} />
        <CardBody className="grid gap-4 sm:grid-cols-3">
          <Field label={t("catalog.field.listPrice")} required error={errs.list}>
            <Input className={ctl} inputMode="decimal" value={form.list} onChange={(e) => set("list", e.target.value)} />
          </Field>
          <Field label={t("catalog.field.salePrice")} hint={t("catalog.field.salePriceHint")} error={errs.sale}>
            <Input className={ctl} inputMode="decimal" value={form.sale} onChange={(e) => set("sale", e.target.value)} />
          </Field>
          <Field label={t("catalog.field.currency")}>
            <Select className={ctl} value={form.currency} onChange={(e) => set("currency", e.target.value)}>
              {(CURRENCIES.includes(form.currency) ? CURRENCIES : [form.currency, ...CURRENCIES]).map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
        </CardBody>
      </Card>

      </div>
      <div className="space-y-4 lg:sticky lg:top-20">
      <Card>
        <CardHeader title={t("catalog.section.stock")} />
        <CardBody className="space-y-4">
          <div className="flex min-h-12 items-center justify-between gap-3">
            <span className="text-[15px] font-medium text-ink">{t("catalog.field.unlimited")}</span>
            <Switch checked={form.unlimited} onCheckedChange={(v) => set("unlimited", v)} label={t("catalog.field.unlimited")} />
          </div>
          {!form.unlimited ? (
            <Field label={t("catalog.field.stock")} error={errs.stock} className="max-w-xs">
              <Input className={ctl} inputMode="numeric" value={form.stock} onChange={(e) => set("stock", e.target.value)} />
            </Field>
          ) : null}
          <div className="flex min-h-12 items-center justify-between gap-3">
            <div>
              <p className="text-[15px] font-medium text-ink">{t("catalog.field.soldOut")}</p>
              <p className="text-sm text-muted">{t("catalog.field.soldOutHint")}</p>
            </div>
            <Switch checked={form.soldOut} onCheckedChange={(v) => set("soldOut", v)} label={t("catalog.field.soldOut")} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("catalog.section.fulfilment")} />
        <CardBody className="space-y-3">
          <div role="radiogroup" aria-label={t("catalog.section.fulfilment")} className="grid grid-cols-3 gap-1 rounded-2xl bg-neutral-surface p-1">
            {modes.map((m) => (
              <button key={m.v} type="button" role="radio" aria-checked={form.mode === m.v} onClick={() => set("mode", m.v)} className={cn("flex h-12 items-center justify-center gap-2 rounded-xl px-2 text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50", form.mode === m.v ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink")}>
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>
          {fulMissing ? (
            <Banner tone="warning" title={form.mode === "pickup" ? t("catalog.fulfilment.pickupMissing") : t("catalog.fulfilment.zonesMissing")} action={<Link href="/catalog/fulfillment" className="text-sm font-semibold underline">{t("catalog.fulfilment.setup")}</Link>} />
          ) : (
            <p className="text-sm text-muted">{t(`catalog.mode.${form.mode}Hint`)}</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("catalog.section.visibility")} action={<StatusBadge status={status} label={t(`catalog.status.${status}`)} />} />
        <CardBody className="space-y-2">
          <div className="flex min-h-12 items-center justify-between gap-3">
            <div>
              <p className="text-[15px] font-medium text-ink">{t("catalog.field.visible")}</p>
              <p className="text-sm text-muted">{t(!canPublish ? "catalog.form.publishLater" : form.visible ? "catalog.field.visibleOn" : "catalog.field.visibleOff")}</p>
            </div>
            <Switch checked={form.visible && canPublish} onCheckedChange={(v) => set("visible", v)} disabled={!canPublish} label={t("catalog.field.visible")} />
          </div>
        </CardBody>
      </Card>

      {current && status !== "archived" ? (
        <div>
          <Button type="button" variant="ghost" className="h-12 text-destructive-text" onClick={() => setArchiveOpen(true)}>
            <Archive />
            {t("catalog.action.archive")}
          </Button>
        </div>
      ) : null}
      </div>
      </div>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 -mx-4 border-t border-hairline bg-white/95 px-4 py-3 backdrop-blur md:bottom-0 md:mx-0 md:rounded-2xl md:border">
        {!canPublish ? <p className="mb-2 text-sm text-muted">{t("catalog.form.publishLater")}</p> : null}
        {dirty ? <p className="mb-2 text-sm font-medium text-warning-text">{t("catalog.form.unsaved")}</p> : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" size="lg" variant="secondary" busy={busy === "draft"} disabled={busy !== null} onClick={() => void save("draft")}>
            {status === "live" ? t("catalog.action.moveToDraft") : t("catalog.action.saveDraft")}
          </Button>
          {canPublish ? (
            <Button type="button" size="lg" busy={busy === (form.visible ? "live" : "draft")} disabled={busy !== null} onClick={() => void save(form.visible ? "live" : "draft")}>
              {form.visible ? (status === "live" ? t("catalog.action.saveChanges") : t("catalog.action.publish")) : t("catalog.action.saveChanges")}
            </Button>
          ) : null}
        </div>
      </div>

      <ConfirmDialog open={archiveOpen} onOpenChange={setArchiveOpen} title={t("catalog.archive.title")} description={t("catalog.archive.body")} confirmLabel={t("catalog.action.archive")} cancelLabel={t("action.cancel")} destructive busy={archiving} onConfirm={archive} />
    </form>
  )
}
