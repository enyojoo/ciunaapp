"use client"

import Link from "next/link"
import { BadgeCheck } from "lucide-react"
import { expertsProfilePath } from "@/lib/experts-public-paths"
import { cn } from "@/lib/utils"

export type HubExpertChipSummary = {
  id: string
  slug?: string | null
  display_name: string
  image_url?: string | null
  is_verified?: boolean | null
  category?: string | null
}

/** Expert row: avatar + name + optional verified (same pattern as HubProductVendorChipLight). */
export function HubExpertChipLight({
  expert,
  className,
  verifiedAriaLabel,
}: {
  expert: HubExpertChipSummary
  className?: string
  verifiedAriaLabel: string
}) {
  const href = expertsProfilePath(expert)

  return (
    <Link
      href={href}
      prefetch
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "group inline-flex max-w-full items-center gap-1.5 rounded-sm py-0.5 text-gray-900 transition hover:text-orange-700",
        className,
      )}
    >
      <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full bg-muted sm:h-6 sm:w-6">
        {expert.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={expert.image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-muted-foreground sm:text-xs">
            {((expert.display_name || "").trim().charAt(0) || "?").toUpperCase()}
          </span>
        )}
      </span>
      <span className="min-w-0 truncate text-[11px] font-medium sm:text-xs">{expert.display_name}</span>
      {expert.is_verified ? (
        <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-orange-600 sm:h-4 sm:w-4" aria-label={verifiedAriaLabel} />
      ) : null}
    </Link>
  )
}
