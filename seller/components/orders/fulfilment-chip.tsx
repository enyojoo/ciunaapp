"use client"
import { Truck, Store, FileText, CalendarClock } from "lucide-react"
import { cn } from "@ciuna/ui-web"
import { useT } from "@/lib/i18n"
import { fulfilmentKind } from "./format"

const ICONS = { delivery: Truck, pickup: Store, digital: FileText, booking: CalendarClock }

export function FulfilmentChip({ mode, className }: { mode: string; className?: string }) {
  const { t } = useT()
  const kind = fulfilmentKind(mode)
  const Icon = ICONS[kind]
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-neutral-surface px-2.5 py-1 text-xs font-semibold text-neutral-text", className)}>
      <Icon className="size-3.5" aria-hidden />
      {t(`orders.mode.${kind}`)}
    </span>
  )
}
