import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "./cn"

/** Age of an item as a chip that turns warning once it passes `limitMinutes`. */
export function AgeSla({ since, limitMinutes, now = Date.now(), format, className }: { since: string | number | Date | null | undefined; limitMinutes: number; now?: number; format?: (minutes: number) => string; className?: string }) {
  if (!since) return null
  const mins = Math.max(0, Math.floor((now - new Date(since).getTime()) / 60_000))
  const over = mins > limitMinutes
  const text = format ? format(mins) : mins >= 1440 ? `${Math.floor(mins / 1440)} d` : mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60} min` : `${mins} min`
  return (
    <span data-state={over ? "warning" : "ok"} className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", over ? "bg-warning-surface text-warning-text" : "bg-neutral-surface text-neutral-text", className)}>
      <Clock className="size-3.5" aria-hidden />
      {text}
    </span>
  )
}
