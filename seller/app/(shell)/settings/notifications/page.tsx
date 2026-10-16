"use client"
import * as React from "react"
import { Send, Mail } from "lucide-react"
import { Banner, Button, Card, CardBody, CardHeader, PageHeader, Skeleton, Switch, useToast } from "@ciuna/ui-web"
import { api, ApiError } from "@/lib/api"
import { useQuery } from "@/lib/query"
import { useSeller } from "@/lib/session"
import { useErrorText, useT } from "@/lib/i18n"

interface State { prefs: { email: boolean; telegram: boolean; muted_kinds: string[] }; telegram: { linked: boolean; username: string | null; botConfigured: boolean }; kinds: string[] }

export default function NotificationsPage() {
  const { merchant } = useSeller()
  const { t } = useT()
  const errText = useErrorText()
  const toast = useToast()
  const q = useQuery<State>("notifications", () => api("/api/merchant/notifications"))
  const [busy, setBusy] = React.useState(false)
  const [linkUrl, setLinkUrl] = React.useState<string | null>(null)
  if (!merchant) return null
  const s = q.data

  async function save(patch: Partial<State["prefs"]>) {
    if (!s) return
    const next = { ...s.prefs, ...patch }
    q.setData({ ...s, prefs: next })
    try { await api("/api/merchant/notifications", { method: "PUT", json: next }) } catch (e) { q.setData(s); toast.show(errText(e instanceof ApiError ? e.code : undefined), "error") }
  }
  async function link() {
    setBusy(true)
    try {
      const { url } = await api<{ url: string }>("/api/merchant/notifications/telegram", { method: "POST" })
      setLinkUrl(url)
      window.open(url, "_blank", "noopener")
      // the webhook links the chat when the seller presses Start; poll briefly to reflect it
      for (let i = 0; i < 20; i++) { await new Promise((r) => setTimeout(r, 3000)); await q.reload(); if (document.hidden === false && (await api<State>("/api/merchant/notifications")).telegram.linked) break }
      await q.reload()
    } catch (e) { toast.show(errText(e instanceof ApiError ? e.code : undefined), "error") } finally { setBusy(false) }
  }
  async function unlink() {
    await api("/api/merchant/notifications/telegram", { method: "DELETE" }); setLinkUrl(null); await q.reload()
  }
  const muted = (k: string) => s?.prefs.muted_kinds.includes(k)
  const toggleKind = (k: string, on: boolean) => save({ muted_kinds: on ? s!.prefs.muted_kinds.filter((x) => x !== k) : [...s!.prefs.muted_kinds, k] })

  return (
    <>
      <PageHeader title={t("notif.title")} description={t("notif.subtitle")} />
      {q.loading && !s ? <Skeleton className="h-48" /> : s ? (
        <div className="space-y-4">
          <Card>
            <CardHeader title={t("notif.channels")} />
            <div className="divide-y divide-hairline">
              <div className="flex items-center gap-3 p-4">
                <Mail className="size-5 text-muted" aria-hidden />
                <div className="min-w-0 flex-1"><p className="font-semibold">{t("notif.email")}</p><p className="text-sm text-muted">{t("notif.email.body")}</p></div>
                <Switch checked={s.prefs.email} onCheckedChange={(v) => save({ email: v })} label={t("notif.email")} />
              </div>
              <div className="flex items-center gap-3 p-4">
                <Send className="size-5 text-muted" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Telegram</p>
                  <p className="text-sm text-muted">{s.telegram.linked ? t("notif.telegram.linked", { name: s.telegram.username ? `@${s.telegram.username}` : "" }) : t("notif.telegram.body")}</p>
                </div>
                {s.telegram.linked ? (
                  <div className="flex items-center gap-3"><Switch checked={s.prefs.telegram} onCheckedChange={(v) => save({ telegram: v })} label="Telegram" /><Button variant="secondary" size="sm" onClick={unlink}>{t("notif.telegram.disconnect")}</Button></div>
                ) : s.telegram.botConfigured ? (
                  <Button size="sm" onClick={link} busy={busy}>{t("notif.telegram.connect")}</Button>
                ) : null}
              </div>
            </div>
          </Card>
          {linkUrl && !s.telegram.linked ? <Banner tone="neutral" title={t("notif.telegram.open")}><a className="font-semibold text-primary-text underline" href={linkUrl} target="_blank" rel="noopener">{t("notif.telegram.openLink")}</a></Banner> : null}
          {!s.telegram.botConfigured ? <Banner tone="neutral" title={t("notif.telegram.unavailable")} /> : null}
          <Card>
            <CardHeader title={t("notif.kinds")} description={t("notif.kinds.body")} />
            <div className="divide-y divide-hairline">
              {s.kinds.filter((k) => (merchant.type === "store" ? k !== "booking_new" : k !== "order_new")).map((k) => (
                <div key={k} className="flex items-center gap-3 p-4">
                  <span className="flex-1 font-semibold">{t(`notif.kind.${k}`)}</span>
                  <Switch checked={!muted(k)} onCheckedChange={(v) => toggleKind(k, v)} label={t(`notif.kind.${k}`)} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </>
  )
}
