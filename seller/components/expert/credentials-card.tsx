"use client"
import * as React from "react"
import { Plus, Trash2 } from "lucide-react"
import { Banner, Button, Card, CardBody, CardHeader, Field, Input, Skeleton, useToast } from "@ciuna/ui-web"
import { api, ApiError } from "@/lib/api"
import { useQuery, invalidate } from "@/lib/query"
import { useErrorText, useT } from "@/lib/i18n"

interface Row { title: string; issuer: string; year: string }
interface Data { credentials: Array<{ title: string; issuer?: string; year?: number }>; yearsExperience: number | null }
const ctl = "h-12 md:h-11"

/** Credentials and years of experience, shown on the expert's public profile. Saves on its own. */
export function CredentialsCard({ editable }: { editable: boolean }) {
  const { t } = useT()
  const errText = useErrorText()
  const toast = useToast()
  const q = useQuery<Data>("expert-credentials", () => api<Data>("/api/merchant/expert/credentials"))
  const [rows, setRows] = React.useState<Row[]>([])
  const [years, setYears] = React.useState("")
  const [loaded, setLoaded] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!q.data || loaded) return
    setRows(q.data.credentials.map((c) => ({ title: c.title, issuer: c.issuer ?? "", year: c.year != null ? String(c.year) : "" })))
    setYears(q.data.yearsExperience != null ? String(q.data.yearsExperience) : "")
    setLoaded(true)
  }, [q.data, loaded])

  const upd = (i: number, patch: Partial<Row>) => setRows((all) => all.map((r, k) => (k === i ? { ...r, ...patch } : r)))

  async function save() {
    setBusy(true); setError(null)
    try {
      await api("/api/merchant/expert/credentials", { method: "PUT", json: { credentials: rows.map((r) => ({ title: r.title, issuer: r.issuer, year: r.year })), yearsExperience: years.trim() } })
      invalidate("expert-credentials")
      toast.show(t("state.saved"))
    } catch (e) { setError(errText(e instanceof ApiError ? e.code : undefined)) } finally { setBusy(false) }
  }

  return (
    <Card>
      <CardHeader title={t("expert.cred.title")} description={t("expert.cred.hint")} />
      <CardBody className="space-y-4">
        {error ? <Banner tone="destructive" title={error} /> : null}
        {!loaded && !q.error ? <Skeleton className="h-24" /> : (
          <>
            <Field label={t("expert.cred.years")}><Input className={ctl} inputMode="numeric" disabled={!editable} value={years} maxLength={2} onChange={(e) => setYears(e.target.value.replace(/\D/g, ""))} /></Field>
            {rows.length === 0 ? <p className="text-sm text-muted">{t("expert.cred.empty")}</p> : null}
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_110px_auto] sm:items-end">
                <Field label={t("expert.cred.name")}><Input className={ctl} disabled={!editable} value={r.title} maxLength={120} onChange={(e) => upd(i, { title: e.target.value })} /></Field>
                <Field label={t("expert.cred.issuer")}><Input className={ctl} disabled={!editable} value={r.issuer} maxLength={120} onChange={(e) => upd(i, { issuer: e.target.value })} /></Field>
                <Field label={t("expert.cred.year")}><Input className={ctl} inputMode="numeric" disabled={!editable} value={r.year} maxLength={4} onChange={(e) => upd(i, { year: e.target.value.replace(/\D/g, "") })} /></Field>
                {editable ? <Button type="button" variant="ghost" className="h-12 text-destructive-text md:h-11" aria-label={t("action.remove")} onClick={() => setRows((all) => all.filter((_, k) => k !== i))}><Trash2 /></Button> : null}
              </div>
            ))}
            {editable ? (
              <div className="flex flex-wrap gap-2">
                {rows.length < 10 ? <Button type="button" variant="secondary" className="h-12 md:h-11" onClick={() => setRows((all) => [...all, { title: "", issuer: "", year: "" }])}><Plus />{t("expert.cred.add")}</Button> : null}
                <Button type="button" className="h-12 md:h-11" busy={busy} onClick={save}>{t("action.save")}</Button>
              </div>
            ) : null}
          </>
        )}
      </CardBody>
    </Card>
  )
}
