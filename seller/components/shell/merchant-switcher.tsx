"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronsUpDown } from "lucide-react"
import { cn } from "@ciuna/ui-web"
import { useSeller } from "@/lib/session"
import { useT } from "@/lib/i18n"

export function MerchantSwitcher({ compact }: { compact?: boolean }) {
  const { me, merchant, setMerchantId } = useSeller()
  const { t } = useT()
  const router = useRouter()
  if (!me || !merchant) return null
  const many = me.merchants.length > 1
  return (
    <label className={cn("relative flex items-center gap-3 rounded-xl", compact ? "min-w-0" : "p-2 hover:bg-neutral-surface")}>
      {merchant.logo_url ? <img src={merchant.logo_url} alt="" className="size-9 shrink-0 rounded-lg object-cover" /> : <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">{merchant.display_name.slice(0, 1).toUpperCase()}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{merchant.display_name}</span>
        <span className="block truncate text-xs text-muted">{t(`type.${merchant.type}`)} · {t(`role.${merchant.role}`)}</span>
      </span>
      {many ? <ChevronsUpDown className="size-4 shrink-0 text-muted" aria-hidden /> : null}
      {many ? (
        <select aria-label={t("merchant.switch")} value={merchant.id} onChange={(e) => { setMerchantId(e.target.value); router.push("/") }} className="absolute inset-0 cursor-pointer opacity-0">
          {me.merchants.map((m) => <option key={m.id} value={m.id}>{m.display_name}</option>)}
        </select>
      ) : null}
    </label>
  )
}
