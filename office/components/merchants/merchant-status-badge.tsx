import { cn } from "@/lib/utils"

const MAP: Record<string, { label: string; cls: string }> = {
  live: { label: "Live", cls: "bg-success-surface text-success-text" },
  approved: { label: "Approved", cls: "bg-success-surface text-success-text" },
  in_review: { label: "In review", cls: "bg-warning-surface text-warning-text" },
  pending: { label: "Pending", cls: "bg-warning-surface text-warning-text" },
  submitted: { label: "Submitted", cls: "bg-warning-surface text-warning-text" },
  changes_requested: { label: "Changes requested", cls: "bg-warning-surface text-warning-text" },
  paused: { label: "Paused", cls: "bg-neutral-surface text-neutral-text" },
  draft: { label: "Draft", cls: "bg-neutral-surface text-neutral-text" },
  expired: { label: "Expired", cls: "bg-neutral-surface text-neutral-text" },
  rejected: { label: "Rejected", cls: "bg-destructive-surface text-destructive-text" },
  suspended: { label: "Suspended", cls: "bg-destructive-surface text-destructive-text" },
}

export function MerchantStatusBadge({ status, className }: { status: string; className?: string }) {
  const m = MAP[status] || { label: status.replace(/_/g, " "), cls: "bg-neutral-surface text-neutral-text" }
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", m.cls, className)}>
      {m.label}
    </span>
  )
}
