"use client"
import * as React from "react"
import Link from "next/link"
import { Bell, Globe, LogOut } from "lucide-react"
import { LANGUAGE_LABELS, cn } from "@ciuna/ui-web"
import { api } from "@/lib/api"
import { useQuery } from "@/lib/query"
import { useSeller } from "@/lib/session"
import { LOCALE_LIST, useT } from "@/lib/i18n"

/** 64px bar from 768px: notifications (new orders or bookings, links to the list) and the account menu. Search is not part of this bar. */
export function TopBar() {
  const { me, merchant, can, signOut } = useSeller()
  const { t, locale, setLocale } = useT()
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const live = !!merchant && ["live", "paused"].includes(merchant.status) && can("orders")
  const counts = useQuery<{ counts: { new: number } }>(live ? "shell:new" : null, () => api("/api/merchant/orders?status=new&limit=1"), { refreshMs: 30_000 })
  const newCount = counts.data?.counts.new ?? 0
  const expert = merchant?.type === "expert"

  React.useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("keydown", onKey)
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey) }
  }, [open])

  if (!me || !merchant) return null
  const name = me.user.name || me.user.email
  const initial = (name || "?").slice(0, 1).toUpperCase()
  return (
    <header className="sticky top-0 z-30 hidden h-16 items-center justify-end gap-2 border-b border-hairline bg-white/90 px-6 backdrop-blur md:flex">
      {live ? (
        <Link href={expert ? "/bookings" : "/orders"} aria-label={newCount ? t("shell.notifications.count", { count: newCount }) : t("shell.notifications")} className="relative flex size-11 items-center justify-center rounded-full text-ink outline-none hover:bg-neutral-surface focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <Bell className="size-5" aria-hidden />
          {newCount ? <span className="absolute right-1 top-1 min-w-5 rounded-full bg-primary px-1 text-center text-[11px] font-bold leading-5 text-primary-foreground">{newCount > 99 ? "99+" : newCount}</span> : null}
        </Link>
      ) : null}
      <div ref={ref} className="relative">
        <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label={t("shell.account")} onClick={() => setOpen((o) => !o)} className="flex size-11 items-center justify-center rounded-full outline-none hover:bg-neutral-surface focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <span className="flex size-9 items-center justify-center rounded-full bg-neutral-surface text-sm font-bold text-ink">{initial}</span>
        </button>
        {open ? (
          <div role="menu" className="absolute right-0 top-12 w-72 rounded-2xl border border-hairline bg-white p-2 shadow-xl">
            <div className="px-3 py-2">
              <p className="truncate text-sm font-semibold text-ink">{name}</p>
              <p className="truncate text-sm text-muted">{me.user.email}</p>
              <p className="mt-0.5 text-xs text-muted">{merchant.display_name} · {t(`role.${merchant.role}`)}</p>
            </div>
            <label className="flex min-h-12 items-center gap-3 rounded-xl px-3 hover:bg-neutral-surface">
              <Globe className="size-5 text-muted" aria-hidden />
              <span className="flex-1 text-sm font-semibold">{t("language.label")}</span>
              <select value={locale} onChange={(e) => setLocale(e.target.value as any)} className="h-9 rounded-lg border border-input-edge bg-white px-2 text-sm">
                {LOCALE_LIST.map((l) => <option key={l} value={l}>{LANGUAGE_LABELS[l]}</option>)}
              </select>
            </label>
            <button type="button" role="menuitem" onClick={() => void signOut()} className={cn("flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left outline-none hover:bg-neutral-surface focus-visible:ring-[3px] focus-visible:ring-ring/50")}>
              <LogOut className="size-5 text-muted" aria-hidden />
              <span className="text-sm font-semibold">{t("action.signOut")}</span>
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
