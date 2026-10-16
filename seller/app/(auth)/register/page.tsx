"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button, Field, Input, Banner } from "@ciuna/ui-web"
import { AuthShell } from "@/components/auth-shell"
import { supabase } from "@/lib/supabase"
import { useT } from "@/lib/i18n"

export default function RegisterPage() {
  const { t } = useT()
  const router = useRouter()
  const [f, setF] = React.useState({ firstName: "", lastName: "", email: "", password: "" })
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [sent, setSent] = React.useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (f.password.length < 8) return setError(t("auth.passwordShort"))
    setBusy(true)
    setError(null)
    const { data, error } = await supabase.auth.signUp({
      email: f.email.trim(),
      password: f.password,
      options: { data: { first_name: f.firstName.trim(), last_name: f.lastName.trim() }, emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    })
    setBusy(false)
    if (error) return setError(/registered|exists/i.test(error.message) ? t("auth.exists") : t("errors.generic"))
    if (data.session) router.replace("/onboarding")
    else setSent(true)
  }

  if (sent)
    return (
      <AuthShell title={t("auth.checkEmail.title")} subtitle={t("auth.checkEmail.body", { email: f.email })}>
        <Link href="/login" className="font-semibold text-primary-text">{t("auth.login.cta")}</Link>
      </AuthShell>
    )

  return (
    <AuthShell
      title={t("auth.register.title")}
      subtitle={t("auth.register.subtitle")}
      footer={<>{t("auth.haveAccount")} <Link href="/login" className="font-semibold text-primary-text">{t("auth.login.cta")}</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error ? <Banner tone="destructive" title={error} /> : null}
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("auth.firstName")}><Input autoComplete="given-name" value={f.firstName} onChange={set("firstName")} required /></Field>
          <Field label={t("auth.lastName")}><Input autoComplete="family-name" value={f.lastName} onChange={set("lastName")} required /></Field>
        </div>
        <Field label={t("auth.email")}><Input type="email" autoComplete="email" inputMode="email" value={f.email} onChange={set("email")} required /></Field>
        <Field label={t("auth.password")} hint={t("auth.passwordHint")}><Input type="password" autoComplete="new-password" value={f.password} onChange={set("password")} required /></Field>
        <Button type="submit" size="lg" className="w-full" busy={busy} disabled={!f.firstName || !f.lastName || !f.email || !f.password}>{t("auth.register.cta")}</Button>
      </form>
    </AuthShell>
  )
}
