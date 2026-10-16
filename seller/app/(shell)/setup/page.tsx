"use client"
import * as React from "react"
import Link from "next/link"
import { CheckCircle2, Circle, FileText, Trash2, Upload } from "lucide-react"
import { Banner, Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Skeleton, StatusBadge, cn, useToast } from "@ciuna/ui-web"
import { api, ApiError, uploadFile } from "@/lib/api"
import { useQuery, invalidate } from "@/lib/query"
import { useSeller } from "@/lib/session"
import { useErrorText, useT } from "@/lib/i18n"
import { ImageUpload } from "@/components/image-upload"

interface KybTier { tier: 1 | 2; label: string; requirements: { fields: Array<{ key: string; label: string; required: boolean }>; documents: Array<{ kind: string; label: string; required: boolean; expires: boolean }> } }
interface AppState { status: string; answers: { tier?: number; fields?: Record<string, string> }; checklist: Array<{ key: string; done: boolean; detail?: string }>; ready: boolean; rejectionReason: string | null }
interface Doc { id: string; kind: string; file_name: string | null; status: string; reason: string | null; expires_at: string | null }

export default function SetupPage() {
  const { merchant, refresh } = useSeller()
  const { t } = useT()
  const errText = useErrorText()
  const toast = useToast()
  const app = useQuery<AppState>("application", () => api("/api/merchant/application"))
  const kyb = useQuery<{ tiers: KybTier[] }>("kyb", () => api("/api/merchant/kyb"))
  const docs = useQuery<{ documents: Doc[] }>("documents", () => api("/api/merchant/documents"))
  const [tier, setTier] = React.useState<number>(0)
  const [fields, setFields] = React.useState<Record<string, string>>({})
  const [busy, setBusy] = React.useState<string | null>(null)
  const [uploading, setUploading] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const seeded = React.useRef(false)

  React.useEffect(() => {
    if (app.data && !seeded.current) {
      seeded.current = true
      setTier(Number(app.data.answers?.tier) || 0)
      setFields(app.data.answers?.fields || {})
    }
  }, [app.data])

  if (!merchant) return null
  const editable = ["draft", "rejected"].includes(merchant.status)
  const selected = kyb.data?.tiers.find((x) => x.tier === tier)
  const done = (key: string) => app.data?.checklist.find((i) => i.key === key)?.done
  const run = async (name: string, fn: () => Promise<void>) => {
    setBusy(name); setError(null)
    try { await fn() } catch (e) { setError(errText(e instanceof ApiError ? e.code : undefined)) } finally { setBusy(null) }
  }

  const saveAnswers = () => run("answers", async () => {
    await api("/api/merchant/application", { method: "PUT", json: { tier, fields } })
    await app.reload(); toast.show(t("state.saved"))
  })

  async function upload(kind: string, file: File | undefined) {
    if (!file) return
    setUploading(kind); setError(null)
    try {
      const res = await uploadFile(file, "document", "kyb")
      await api("/api/merchant/documents", { method: "POST", json: { kind, path: res.path, fileName: file.name } })
      await Promise.all([docs.reload(), app.reload()])
    } catch (e) { setError(errText(e instanceof ApiError ? e.code : undefined)) } finally { setUploading(null) }
  }
  const removeDoc = (id: string) => run("doc", async () => { await api(`/api/merchant/documents/${id}`, { method: "DELETE" }); await Promise.all([docs.reload(), app.reload()]) })

  const submit = () => run("submit", async () => {
    await api("/api/merchant/application", { method: "PUT", json: { tier, fields } })
    await api("/api/merchant/application", { method: "POST" })
    invalidate(); await refresh(); await app.reload()
    toast.show(t("setup.submitted"))
  })

  const listingHref = merchant.type === "store" ? "/catalog/new" : "/services/new"
  const Step = ({ n, title, ok, children }: { n: number; title: string; ok?: boolean; children: React.ReactNode }) => (
    <Card>
      <CardHeader title={`${n}. ${title}`} action={ok ? <CheckCircle2 className="size-5 text-success" aria-label={t("setup.done")} /> : <Circle className="size-5 text-subtle" aria-label={t("setup.todo")} />} />
      <CardBody className="space-y-4">{children}</CardBody>
    </Card>
  )

  return (
    <>
      <PageHeader title={t("setup.title")} description={t("setup.subtitle")} action={<StatusBadge status={merchant.status} label={t(`status.${merchant.status}`)} />} />
      {merchant.status === "rejected" && merchant.rejection_reason ? <div className="mb-4"><Banner tone="destructive" title={t("banner.rejected.title")}>{merchant.rejection_reason}</Banner></div> : null}
      {merchant.status === "in_review" ? <div className="mb-4"><Banner tone="neutral" title={t("banner.review.title")}>{t("banner.review.body")}</Banner></div> : null}
      {merchant.status === "live" || merchant.status === "paused" ? <div className="mb-4"><Banner tone="success" title={t("setup.approved")} /></div> : null}
      {error ? <div className="mb-4"><Banner tone="destructive" title={error} /></div> : null}
      {app.loading && !app.data ? <Skeleton className="h-64" /> : (
        <div className="space-y-4">
          <Step n={1} title={t("setup.item.profile")} ok={done("profile")}>
            <p className="text-sm text-muted">{t("setup.profile.body")}</p>
            <Link href="/profile"><Button variant="secondary">{t("setup.profile.cta")}</Button></Link>
          </Step>

          <Step n={2} title={t("setup.item.logo")} ok={done("logo")}>
            <ImageUpload className="max-w-[200px]" aspect="aspect-square" folder="logo" label={t("setup.logo.upload")} value={merchant.logo_url} onChange={async (url) => { await api("/api/merchant/profile", { method: "PATCH", json: { logo_url: url } }); await refresh() }} />
          </Step>

          <Step n={3} title={t("setup.verify.title")} ok={done("tier") && done("kyb_fields") && done("kyb_documents")}>
            <p className="text-sm text-muted">{t("setup.verify.body")}</p>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t("setup.verify.tier")}>
              {kyb.data?.tiers.map((x) => (
                <button key={x.tier} type="button" role="radio" aria-checked={tier === x.tier} disabled={!editable} onClick={() => setTier(x.tier)} className={cn("rounded-2xl border p-4 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60", tier === x.tier ? "border-primary-border bg-primary-tint" : "border-hairline bg-white")}>
                  <span className="block font-semibold">{x.label}</span>
                  <span className="mt-0.5 block text-sm text-muted">{t(x.tier === 1 ? "setup.tier1.body" : "setup.tier2.body")}</span>
                </button>
              ))}
            </div>
            {selected ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  {selected.requirements.fields.map((f) => (
                    <Field key={f.key} label={f.label} required={f.required}><Input disabled={!editable} value={fields[f.key] || ""} onChange={(e) => setFields((p) => ({ ...p, [f.key]: e.target.value }))} /></Field>
                  ))}
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold">{t("setup.docs.title")}</h3>
                  <ul className="space-y-2">
                    {selected.requirements.documents.map((d) => {
                      const mine = (docs.data?.documents || []).filter((x) => x.kind === d.kind)
                      return (
                        <li key={d.kind} className="rounded-xl border border-hairline p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="flex items-center gap-2 text-[15px] font-medium"><FileText className="size-4 text-muted" aria-hidden />{d.label}{d.required ? null : <span className="text-xs text-muted">{t("setup.optional")}</span>}</span>
                            {editable ? (
                              <label className={cn("inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-input-edge bg-white px-3 text-sm font-semibold hover:bg-neutral-surface focus-within:ring-[3px] focus-within:ring-ring/50", uploading === d.kind && "opacity-60")}>
                                <Upload className="size-4" aria-hidden />{uploading === d.kind ? t("state.loading") : t("action.upload")}
                                <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only" onChange={(e) => { void upload(d.kind, e.target.files?.[0]); e.target.value = "" }} />
                              </label>
                            ) : null}
                          </div>
                          {mine.map((m) => (
                            <div key={m.id} className="mt-2 flex items-center justify-between gap-2 text-sm">
                              <span className="min-w-0 truncate text-muted">{m.file_name || m.kind}</span>
                              <span className="flex shrink-0 items-center gap-2">
                                <StatusBadge status={m.status === "pending" ? "in_review" : m.status} label={t(`doc.${m.status}`)} />
                                {m.status !== "approved" && editable ? <button type="button" onClick={() => removeDoc(m.id)} aria-label={t("action.remove")} className="flex size-9 items-center justify-center rounded-full text-destructive-text hover:bg-destructive-surface"><Trash2 className="size-4" /></button> : null}
                              </span>
                              {m.status === "rejected" && m.reason ? <p className="basis-full text-destructive-text">{m.reason}</p> : null}
                            </div>
                          ))}
                        </li>
                      )
                    })}
                  </ul>
                </div>
                {editable ? <Button variant="secondary" onClick={saveAnswers} busy={busy === "answers"}>{t("action.save")}</Button> : null}
              </>
            ) : null}
          </Step>

          <Step n={4} title={t(merchant.type === "store" ? "setup.listing.store" : "setup.listing.expert")} ok={done("first_listing")}>
            <p className="text-sm text-muted">{t("setup.listing.body")}</p>
            <Link href={listingHref}><Button variant="secondary">{t(merchant.type === "store" ? "setup.listing.addProduct" : "setup.listing.addService")}</Button></Link>
          </Step>

          {editable ? (
            <Card>
              <CardBody className="space-y-3">
                <h2 className="text-base font-semibold">{t("setup.submit.title")}</h2>
                <p className="text-sm text-muted">{t(app.data?.ready ? "setup.submit.ready" : "setup.submit.notReady")}</p>
                <Button size="lg" className="w-full sm:w-auto" onClick={submit} busy={busy === "submit"} disabled={!tier}>{t("setup.submit.cta")}</Button>
              </CardBody>
            </Card>
          ) : null}
        </div>
      )}
    </>
  )
}
