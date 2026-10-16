import * as React from "react"
import { X } from "lucide-react"
import { cn } from "./cn"

export type ChipTone = "neutral" | "primary" | "success" | "warning" | "destructive"
const TONE: Record<ChipTone, string> = {
  neutral: "bg-neutral-surface text-neutral-text",
  primary: "bg-primary-tint text-primary-text",
  success: "bg-success-surface text-success-text",
  warning: "bg-warning-surface text-warning-text",
  destructive: "bg-destructive-surface text-destructive-text",
}

/** Small label. Pass `onClick` for a selectable filter chip (`selected`), `onRemove` for a removable one. */
export function Chip({ children, tone = "neutral", selected, onClick, onRemove, removeLabel = "Remove", icon, className }: { children: React.ReactNode; tone?: ChipTone; selected?: boolean; onClick?: () => void; onRemove?: () => void; removeLabel?: string; icon?: React.ReactNode; className?: string }) {
  const base = cn("inline-flex items-center gap-1.5 rounded-full text-xs font-semibold [&_svg]:size-3.5", className)
  if (onClick) {
    return (
      <button type="button" aria-pressed={!!selected} onClick={onClick} className={cn(base, "h-9 border px-3.5 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50", selected ? "border-primary bg-primary text-primary-foreground" : "border-input-edge bg-white text-ink hover:bg-neutral-surface")}>
        {icon}
        {children}
      </button>
    )
  }
  return (
    <span className={cn(base, "px-2.5 py-1", TONE[tone])}>
      {icon}
      {children}
      {onRemove ? (
        <button type="button" onClick={onRemove} aria-label={removeLabel} className="-mr-1 flex size-5 items-center justify-center rounded-full hover:bg-black/5">
          <X />
        </button>
      ) : null}
    </span>
  )
}
