"use client"
import * as React from "react"
import { Copy, Trash2 } from "lucide-react"
import { Banner, Button, Card, CardBody, CardHeader, ConfirmDialog, EmptyState, Field, Input, PageHeader, Select, Skeleton, useToast } from "@ciuna/ui-web"
import { SellerNoAccess } from "@/components/no-access"
import { api, ApiError } from "@/lib/api"
import { useQuery } from "@/lib/query"
import { useSeller } from "@/lib/session"
import { useErrorText, useT } from "@/lib/i18n"

interface Team { members: Array<{ user_id: string; role: string; users: { email: string; first_name: string | null; last_name: string | null } | null }>; invites: Array<{ id: string; email: string; role: string; expires_at: string }> }

export default function TeamPage() {
  const { merchant, can, me } = useSeller()
  const { t } = useT()
  const errText = useErrorText()
  const toast = useToast()
  const team = useQuery<Team>(can("team") ? "team" : null, () => api("/api/merchant/team"))
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState("staff")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [removing, setRemoving] = React.useState<string | null>(null)
  if (!merchant) return null
  if (!can("team")) return <SellerNoAccess />

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const { invite } = await api<{ invite: { token: string } }>("/api/merchant/team/invites", { method: "POST", json: { email, role } })
      const link = `${window.location.origin}/onboarding?invite=${invite.token}`
      try { await navigator.clipboard.writeText(link); toast.show(t("team.invite.copied")) } catch { toast.show(link) }
      setEmail(""); await team.reload()
    } catch (err) { setError(errText(err instanceof ApiError ? err.code : undefined)) } finally { setBusy(false) }
  }
  async function changeRole(userId: string, r: string) {
    try { await api(`/api/merchant/team/members/${userId}`, { method: "PATCH", json: { role: r } }); await team.reload() } catch (err) { toast.show(errText(err instanceof ApiError ? err.code : undefined), "error") }
  }
  async function remove() {
    if (!removing) return
    try { await api(`/api/merchant/team/members/${removing}`, { method: "DELETE" }); await team.reload() } catch (err) { toast.show(errText(err instanceof ApiError ? err.code : undefined), "error") }
    setRemoving(null)
  }

  return (
    <>
      <PageHeader title={t("team.title")} description={t("team.subtitle")} />
      <div className="space-y-4">
        <Card>
          <CardHeader title={t("team.invite")} description={t("team.role.hint")} />
          <CardBody>
            <form onSubmit={invite} className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end" noValidate>
              <Field label={t("auth.email")}><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
              <Field label={t("team.role")}><Select value={role} onChange={(e) => setRole(e.target.value)}>{["manager", "staff", "finance"].map((r) => <option key={r} value={r}>{t(`role.${r}`)}</option>)}</Select></Field>
              <Button type="submit" busy={busy} disabled={!email}>{t("team.invite.cta")}</Button>
            </form>
            {error ? <div className="mt-3"><Banner tone="destructive" title={error} /></div> : null}
          </CardBody>
        </Card>

        <Card className="divide-y divide-hairline">
          {team.loading && !team.data ? <div className="p-4"><Skeleton className="h-16" /></div> : null}
          {team.data?.members.map((m) => {
            const isMe = m.user_id === me?.user.id
            const name = [m.users?.first_name, m.users?.last_name].filter(Boolean).join(" ") || m.users?.email
            return (
              <div key={m.user_id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">{name}{isMe ? ` · ${t("team.you")}` : ""}</p><p className="truncate text-sm text-muted">{m.users?.email}</p></div>
                {m.role === "owner" || isMe ? <span className="text-sm font-semibold text-muted">{t(`role.${m.role}`)}</span> : (
                  <>
                    <Select aria-label={t("team.role")} className="w-36" value={m.role} onChange={(e) => changeRole(m.user_id, e.target.value)}>{["manager", "staff", "finance"].map((r) => <option key={r} value={r}>{t(`role.${r}`)}</option>)}</Select>
                    <button type="button" aria-label={t("team.remove")} onClick={() => setRemoving(m.user_id)} className="flex size-10 items-center justify-center rounded-full text-destructive-text hover:bg-destructive-surface"><Trash2 className="size-4" /></button>
                  </>
                )}
              </div>
            )
          })}
        </Card>

        {team.data?.invites.length ? (
          <Card>
            <CardHeader title={t("team.pending")} />
            <ul className="divide-y divide-hairline">
              {team.data.invites.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 p-4"><span className="truncate">{i.email}</span><span className="text-sm text-muted">{t(`role.${i.role}`)}</span></li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
      <ConfirmDialog open={Boolean(removing)} onOpenChange={(o) => !o && setRemoving(null)} title={t("team.remove.q")} confirmLabel={t("team.remove")} cancelLabel={t("action.cancel")} destructive onConfirm={remove} />
    </>
  )
}
