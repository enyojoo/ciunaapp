"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { Sheet, cn } from "@ciuna/ui-web"
import { useSeller, type SellerMerchant } from "@/lib/session"
import { useT } from "@/lib/i18n"

function Tile({ m, size = "size-9" }: { m: Pick<SellerMerchant, "logo_url" | "display_name" | "type">; size?: string }) {
  const shape = m.type === "expert" ? "rounded-full" : "rounded-lg"
  return m.logo_url
    ? <img src={m.logo_url} alt="" className={cn(size, "shrink-0 object-cover", shape)} />
    : <span aria-hidden className={cn(size, "flex shrink-0 items-center justify-center bg-primary text-sm font-bold text-primary-foreground", shape)}>{m.display_name.slice(0, 1).toUpperCase()}</span>
}

/** Business, "Type · Role", chevron when there is more than one. Opens a list with the current business checked and an Add a business row. */
export function MerchantSwitcher({ compact }: { compact?: boolean }) {
  const { me, merchant, setMerchantId } = useSeller()
  const { t } = useT()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  if (!me || !merchant) return null
  const many = me.merchants.length > 1
  const body = (
    <>
      <Tile m={merchant} />
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-semibold">{merchant.display_name}</span>
        <span className="block truncate text-xs text-muted">{t(`type.${merchant.type}`)} · {t(`role.${merchant.role}`)}</span>
      </span>
      {many ? <ChevronsUpDown className="size-4 shrink-0 text-muted" aria-hidden /> : null}
    </>
  )
  return (
    <>
      {many ? (
        <button type="button" aria-haspopup="dialog" aria-label={t("merchant.switch")} onClick={() => setOpen(true)} className={cn("flex w-full items-center gap-3 rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50", compact ? "min-w-0" : "p-2 hover:bg-neutral-surface")}>{body}</button>
      ) : (
        <div className={cn("flex items-center gap-3 rounded-xl", compact ? "min-w-0" : "p-2")}>{body}</div>
      )}
      <Sheet open={open} onOpenChange={setOpen} title={t("merchant.switch")}>
        <ul className="-mx-2 space-y-1">
          {me.merchants.map((m) => {
            const current = m.id === merchant.id
            return (
              <li key={m.id}>
                <button type="button" aria-current={current ? "true" : undefined} onClick={() => { if (!current) { setMerchantId(m.id); router.push("/") } setOpen(false) }} className="flex min-h-14 w-full items-center gap-3 rounded-xl px-2 text-left outline-none hover:bg-neutral-surface focus-visible:ring-[3px] focus-visible:ring-ring/50">
                  <Tile m={m} size="size-10" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{m.display_name}</span>
                    <span className="block truncate text-sm text-muted">{t(`type.${m.type}`)} · {t(`role.${m.role}`)}</span>
                  </span>
                  {current ? <Check className="size-5 text-primary-text" aria-label={t("merchant.current")} /> : null}
                </button>
              </li>
            )
          })}
          <li>
            <Link href="/onboarding" onClick={() => setOpen(false)} className="flex min-h-14 items-center gap-3 rounded-xl px-2 font-semibold text-primary-text outline-none hover:bg-neutral-surface focus-visible:ring-[3px] focus-visible:ring-ring/50">
              <span className="flex size-10 items-center justify-center rounded-lg border border-dashed border-input-edge"><Plus className="size-5" aria-hidden /></span>
              {t("merchant.add")}
            </Link>
          </li>
        </ul>
      </Sheet>
    </>
  )
}
