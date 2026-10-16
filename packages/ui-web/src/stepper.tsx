import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "./cn"

/** Horizontal steps: done (check), current (filled), upcoming. The current step is announced with aria-current. */
export function Stepper({ steps, current, className }: { steps: Array<{ key: string; label: string }>; current: number; className?: string }) {
  return (
    <ol className={cn("flex items-start gap-2", className)}>
      {steps.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={s.key} aria-current={active ? "step" : undefined} className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", done ? "bg-success-surface text-success-text" : active ? "bg-primary text-primary-foreground" : "bg-neutral-surface text-muted")}>
                {done ? <Check className="size-4" aria-hidden /> : i + 1}
              </span>
              {i < steps.length - 1 ? <span aria-hidden className={cn("h-0.5 flex-1 rounded-full", done ? "bg-success" : "bg-hairline")} /> : null}
            </div>
            <span className={cn("truncate text-xs font-semibold", active ? "text-ink" : "text-muted")}>{s.label}</span>
          </li>
        )
      })}
    </ol>
  )
}
