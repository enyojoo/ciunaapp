import * as React from "react"
import { CheckCircle2, Clock, XCircle, MinusCircle } from "lucide-react"
import { cn } from "./cn"

export type StatusTone = "success" | "warning" | "destructive" | "neutral"

/** One word, one colour pair, everywhere. Map by status word, never by caller colour. */
export const STATUS_TONES: Record<string, StatusTone> = {
  completed: "success", paid: "success", live: "success", verified: "success", approved: "success", accepted: "success", ready: "success", shipped: "success",
  pending: "warning", preparing: "warning", "in review": "warning", in_review: "warning", new: "warning", awaiting: "warning", processing: "warning", changes_requested: "warning",
  failed: "destructive", rejected: "destructive", overdue: "destructive", suspended: "destructive", declined: "destructive",
  draft: "neutral", paused: "neutral", cancelled: "neutral", refunded: "neutral", archived: "neutral", expired: "neutral",
}

const TONE_CLASS: Record<StatusTone, string> = {
  success: "bg-success-surface text-success-text",
  warning: "bg-warning-surface text-warning-text",
  destructive: "bg-destructive-surface text-destructive-text",
  neutral: "bg-neutral-surface text-neutral-text",
}
const ICON: Record<StatusTone, React.ComponentType<{ className?: string }>> = { success: CheckCircle2, warning: Clock, destructive: XCircle, neutral: MinusCircle }

export function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  const tone = STATUS_TONES[status.toLowerCase()] ?? "neutral"
  const Icon = ICON[tone]
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", TONE_CLASS[tone], className)}>
      <Icon className="size-3.5" aria-hidden />
      {label ?? status.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())}
    </span>
  )
}
