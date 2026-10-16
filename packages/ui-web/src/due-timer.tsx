"use client"
import * as React from "react"
import { Timer } from "lucide-react"
import { cn } from "./cn"

export type DueTimerState = "running" | "warning" | "overdue"

/** Whole minutes until `dueAt` (negative once overdue). */
export function minutesUntil(dueAt: string | number | Date, now: number): number {
  return Math.round((new Date(dueAt).getTime() - now) / 60_000)
}

export function dueTimerState(minutes: number, warnUnderMinutes = 5): DueTimerState {
  return minutes < 0 ? "overdue" : minutes < warnUnderMinutes ? "warning" : "running"
}

export interface DueTimerLabels {
  /** "Due in 12 min" */
  dueIn: (span: string) => string
  /** "Overdue by 6 min" */
  overdue: (span: string) => string
  /** "1 h 20 min" or "12 min" */
  span: (hours: number, minutes: number) => string
}
const EN: DueTimerLabels = {
  dueIn: (s) => `Due in ${s}`,
  overdue: (s) => `Overdue by ${s}`,
  span: (h, m) => (h > 0 ? `${h} h ${m} min` : `${m} min`),
}

const TONE: Record<DueTimerState, string> = {
  running: "border-hairline bg-white text-ink",
  warning: "border-warning-text/30 bg-warning-surface text-warning-text",
  overdue: "border-destructive-text/30 bg-destructive-surface text-destructive-text",
}

/** Countdown to an SLA time. Running, warning under 5 minutes, overdue. Words plus colour, refreshes every 30 s. Renders nothing without a due time. */
export function DueTimer({ dueAt, size = "sm", labels = EN, warnUnderMinutes = 5, now: nowProp, className }: { dueAt: string | number | Date | null | undefined; size?: "sm" | "md"; labels?: DueTimerLabels; warnUnderMinutes?: number; now?: number; className?: string }) {
  const [tick, setTick] = React.useState(() => Date.now())
  React.useEffect(() => {
    if (nowProp !== undefined) return
    const id = setInterval(() => setTick(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [nowProp])
  if (!dueAt) return null
  const mins = minutesUntil(dueAt, nowProp ?? tick)
  const abs = Math.abs(mins)
  const span = labels.span(Math.floor(abs / 60), abs % 60)
  const state = dueTimerState(mins, warnUnderMinutes)
  return (
    <span data-state={state} className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 font-semibold", size === "md" ? "h-9 text-sm" : "h-7 text-xs", TONE[state], className)}>
      <Timer className={size === "md" ? "size-4" : "size-3.5"} aria-hidden />
      {state === "overdue" ? labels.overdue(span) : labels.dueIn(span)}
    </span>
  )
}
