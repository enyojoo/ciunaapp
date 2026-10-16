import { cn } from "@/lib/utils"

export function ReviewStatusBadge({ status }: { status: "published" | "hidden" }) {
  const hidden = status === "hidden"
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", hidden ? "bg-neutral-surface text-neutral-text" : "bg-success-surface text-success-text")}>
      {hidden ? "Hidden" : "Published"}
    </span>
  )
}
