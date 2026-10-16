"use client"
import * as React from "react"
import { BrandLogo } from "@ciuna/shared"
import { useT, LOCALE_LIST } from "@/lib/i18n"
import { LANGUAGE_LABELS } from "@ciuna/ui-web"

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const { locale, setLocale } = useT()
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-8 pt-6 pt-safe">
      <div className="mb-8 flex items-center justify-between">
        <BrandLogo size="lg" />
        <select aria-label="Language" value={locale} onChange={(e) => setLocale(e.target.value as any)} className="h-10 rounded-xl border border-input-edge bg-white px-3 text-sm">
          {LOCALE_LIST.map((l) => <option key={l} value={l}>{LANGUAGE_LABELS[l]}</option>)}
        </select>
      </div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {subtitle ? <p className="mt-1.5 text-[15px] text-muted">{subtitle}</p> : null}
      <div className="mt-6 flex-1">{children}</div>
      {footer ? <p className="mt-8 text-center text-sm text-muted">{footer}</p> : null}
    </main>
  )
}
