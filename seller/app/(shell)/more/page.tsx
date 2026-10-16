"use client"
import Link from "next/link"
import { UserRound, ShieldCheck, Users, Globe, LogOut, Store, ChevronRight, Wallet, Package, Clock } from "lucide-react"
import { Card, PageHeader, LANGUAGE_LABELS } from "@ciuna/ui-web"
import { useSeller } from "@/lib/session"
import { useT, LOCALE_LIST } from "@/lib/i18n"

export default function MorePage() {
  const { merchant, can, signOut, me } = useSeller()
  const { t, locale, setLocale } = useT()
  if (!merchant) return null
  const rows = [
    { href: "/profile", icon: UserRound, label: t(merchant.type === "store" ? "more.storeProfile" : "more.expertProfile"), show: can("profile") },
    { href: "/setup", icon: ShieldCheck, label: t("more.verification"), show: can("documents") },
    ...(merchant.type === "store" ? [{ href: "/catalog/fulfillment", icon: Package, label: t("more.fulfillment"), show: can("catalog") }] : [{ href: "/availability", icon: Clock, label: t("nav.availability"), show: can("availability") }]),
    { href: "/settings/team", icon: Users, label: t("more.team"), show: can("team") },
  ].filter((r) => r.show)

  return (
    <>
      <PageHeader title={t("nav.more")} description={me?.user.email} />
      <Card className="divide-y divide-hairline overflow-hidden">
        {rows.map((r) => (
          <Link key={r.href} href={r.href} className="flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-neutral-surface">
            <r.icon className="size-5 text-muted" aria-hidden />
            <span className="flex-1 font-semibold">{r.label}</span>
            <ChevronRight className="size-4 text-subtle" aria-hidden />
          </Link>
        ))}
        <label className="flex min-h-14 items-center gap-3 px-4 py-3">
          <Globe className="size-5 text-muted" aria-hidden />
          <span className="flex-1 font-semibold">{t("language.label")}</span>
          <select value={locale} onChange={(e) => setLocale(e.target.value as any)} className="h-10 rounded-xl border border-input-edge bg-white px-3 text-sm">
            {LOCALE_LIST.map((l) => <option key={l} value={l}>{LANGUAGE_LABELS[l]}</option>)}
          </select>
        </label>
        <button type="button" onClick={signOut} className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left hover:bg-neutral-surface">
          <LogOut className="size-5 text-muted" aria-hidden />
          <span className="font-semibold">{t("action.signOut")}</span>
        </button>
      </Card>
    </>
  )
}
