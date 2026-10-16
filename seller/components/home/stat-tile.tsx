"use client"
import * as React from "react"
import Link from "next/link"
import { ArrowRight, ArrowDownRight, ArrowUpRight } from "lucide-react"
import { Card, Skeleton, cn } from "@ciuna/ui-web"

/** Icon and label, one large value, one line below. Links to its list when `href` is set. `delta` renders only when the API supplies it (arrow plus words, never colour alone). */
export function StatTile({ icon, label, value, hint, href, actionable, loading, delta, badge, className }: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  hint?: string
  href?: string
  actionable?: boolean
  loading?: boolean
  delta?: { direction: "up" | "down"; text: string } | null
  badge?: React.ReactNode
  className?: string
}) {
  const body = (
    <Card selected={actionable} className={cn("h-full p-4 transition-shadow sm:p-5", href && "hover:shadow-md", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-muted [&_svg]:size-5 [&_svg]:text-primary-text">{icon}{label}</span>
        {href ? <ArrowRight className="size-4 text-muted" aria-hidden /> : null}
      </div>
      {loading ? (
        <div className="mt-4 space-y-2" aria-hidden><Skeleton className="h-8 w-16" /><Skeleton className="h-4 w-32" /></div>
      ) : (
        <>
          <p className="mt-3 text-[26px] font-bold leading-tight tabular-nums text-ink sm:text-3xl">{value}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {hint ? <p className="text-sm text-muted">{hint}</p> : null}
            {badge}
            {delta ? (
              <span className={cn("inline-flex items-center gap-1 text-sm font-semibold", delta.direction === "up" ? "text-success-text" : "text-destructive-text")}>
                {delta.direction === "up" ? <ArrowUpRight className="size-4" aria-hidden /> : <ArrowDownRight className="size-4" aria-hidden />}
                {delta.text}
              </span>
            ) : null}
          </div>
        </>
      )}
    </Card>
  )
  return href ? <Link href={href} className="block rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">{body}</Link> : body
}
