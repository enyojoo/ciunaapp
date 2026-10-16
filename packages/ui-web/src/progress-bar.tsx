import * as React from "react"
import { cn } from "./cn"

/** Linear progress with an optional label and value text. Meaning is in the words, not the colour. */
export function ProgressBar({ value, max = 100, label, valueText, tone = "primary", className }: { value: number; max?: number; label?: string; valueText?: string; tone?: "primary" | "success" | "warning" | "destructive"; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  const fill = { primary: "bg-primary", success: "bg-success", warning: "bg-warning-text", destructive: "bg-destructive" }[tone]
  return (
    <div className={className}>
      {label || valueText ? (
        <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
          {label ? <span className="font-semibold text-ink">{label}</span> : <span />}
          {valueText ? <span className="tabular-nums text-muted">{valueText}</span> : null}
        </div>
      ) : null}
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)} aria-valuetext={valueText} className="h-2 overflow-hidden rounded-full bg-neutral-surface">
        <div className={cn("h-full rounded-full transition-[width]", fill)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
