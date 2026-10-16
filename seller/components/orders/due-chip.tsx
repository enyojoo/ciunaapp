"use client"
import * as React from "react"
import { Timer } from "lucide-react"
import { cn } from "@ciuna/ui-web"
import { useT } from "@/lib/i18n"
import { minutesUntil, splitDuration } from "./format"

/** Countdown to the SLA time. Overdue is stated in words and shown in destructive text, never colour alone. */
export function DueChip({ dueAt, className }: { dueAt: string | null; className?: string }) {
  const { t } = useT()
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])
  if (!dueAt) return null
  const mins = minutesUntil(dueAt, now)
  const { hours, minutes } = splitDuration(mins)
  const span = hours > 0 ? t("orders.duration.hm", { h: hours, m: minutes }) : t("orders.duration.m", { m: minutes })
  const overdue = mins < 0
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", overdue ? "border-destructive-text/30 bg-destructive-surface text-destructive-text" : "border-hairline bg-white text-ink", className)}>
      <Timer className="size-3.5" aria-hidden />
      {overdue ? t("orders.due.overdue", { time: span }) : t("orders.due.in", { time: span })}
    </span>
  )
}
