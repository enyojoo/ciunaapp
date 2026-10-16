import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDateTime } from "./merchant-lib"

export function ageLabel(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  if (h < 48) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

/**
 * Age of a queue item as a chip. Past `limitHours` (default 24) and with `warn` set it turns warning and says so in words
 * ("Over 24h"), so the state never rests on colour alone.
 */
export function RelativeAge({ iso, warn, limitHours = 24 }: { iso?: string | null; warn?: boolean; limitHours?: number }) {
  if (!iso) return <span className="text-muted-foreground">-</span>
  const over = !!warn && Date.now() - new Date(iso).getTime() > limitHours * 3600 * 1000
  return (
    <span
      title={formatDateTime(iso)}
      data-state={over ? "warning" : "ok"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums",
        over ? "bg-warning-surface text-warning-text" : "text-muted-foreground",
      )}
    >
      {over ? <Clock className="h-3 w-3" aria-hidden /> : null}
      {ageLabel(iso)}
      {over ? <span className="font-normal">· over {limitHours}h</span> : null}
    </span>
  )
}
