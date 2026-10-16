import * as React from "react"
import { Lock } from "lucide-react"
import { cn } from "./cn"

/** Lock screen for a page the signed-in person has no permission for: title, reason, a way back. */
export function NoAccess({
  title,
  reason,
  backHref,
  backLabel,
  linkAs: Link = "a",
  className,
}: {
  title: string
  reason?: string
  backHref?: string
  backLabel?: string
  /** Router link component (for example next/link); defaults to a plain anchor. */
  linkAs?: React.ElementType
  className?: string
}) {
  return (
    <div role="status" className={cn("flex flex-col items-center px-6 py-16 text-center", className)}>
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-neutral-surface text-neutral-text">
        <Lock className="size-6" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {reason ? <p className="mt-1.5 max-w-sm text-sm text-muted">{reason}</p> : null}
      {backHref && backLabel ? (
        <Link href={backHref} className="mt-5 inline-flex h-11 items-center rounded-xl border border-input-edge bg-white px-5 text-[15px] font-semibold text-ink outline-none hover:bg-neutral-surface focus-visible:ring-[3px] focus-visible:ring-ring/50">
          {backLabel}
        </Link>
      ) : null}
    </div>
  )
}
