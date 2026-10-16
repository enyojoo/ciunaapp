import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Sla { limit_hours: number; business?: boolean; waited_hours: number; over_by_hours: number | null; breached: boolean }

export function hoursLabel(h: number): string {
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m`
  if (h < 48) return `${Math.round(h)}h`
  return `${Math.round(h / 24)}d`
}

/** SLA state in words, never colour alone: "Over by 2h" once breached, otherwise "Due in 5h". */
export function SlaChip({ sla }: { sla?: Sla | null }) {
  if (!sla) return <span className="text-muted-foreground">-</span>
  const left = Math.max(0, sla.limit_hours - sla.waited_hours)
  return (
    <span
      data-state={sla.breached ? "breached" : "ok"}
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums", sla.breached ? "bg-destructive-surface text-destructive-text" : "text-muted-foreground")}
    >
      {sla.breached ? <Clock className="h-3 w-3" aria-hidden /> : null}
      {sla.breached ? `Over by ${hoursLabel(sla.over_by_hours ?? 0)}` : `Due in ${hoursLabel(left)}`}
    </span>
  )
}
