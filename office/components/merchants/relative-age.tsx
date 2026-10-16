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

/** Relative age; warning tone when older than 24h and `warn` is set. */
export function RelativeAge({ iso, warn }: { iso?: string | null; warn?: boolean }) {
  if (!iso) return <span className="text-muted-foreground">-</span>
  const old = Date.now() - new Date(iso).getTime() > 24 * 3600 * 1000
  return (
    <span
      title={formatDateTime(iso)}
      className={cn("tabular-nums", warn && old ? "font-medium text-warning-text" : "text-muted-foreground")}
    >
      {ageLabel(iso)}
    </span>
  )
}
