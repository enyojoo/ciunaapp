"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button, Field, Input, Banner } from "@ciuna/ui-web"
import { AuthShell } from "@/components/auth-shell"
import { supabase } from "@/lib/supabase"
import { useT } from "@/lib/i18n"

function LoginForm() {
  const { t } = useT()
  const router = useRouter()
  const next = useSearchParams().get("next") || "/"
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) return setError(t("auth.invalid"))
    router.replace(next.startsWith("/") ? next : "/")
  }

  return (
    <AuthShell
      title={t("auth.login.title")}
      subtitle={t("auth.login.subtitle")}
      footer={<>{t("auth.noAccount")} <Link href="/register" className="font-semibold text-primary-text">{t("auth.register.cta")}</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error ? <Banner tone="destructive" title={error} /> : null}
        <Field label={t("auth.email")}><Input type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        <Field label={t("auth.password")}><Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
        <Button type="submit" size="lg" className="w-full" busy={busy} disabled={!email || !password}>{t("auth.login.cta")}</Button>
      </form>
    </AuthShell>
  )
}

export default function LoginPage() {
  return <React.Suspense><LoginForm /></React.Suspense>
}
