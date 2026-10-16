import * as React from "react"
import { Star } from "lucide-react"
import { cn } from "./cn"

const SIZE = { sm: "size-3.5", md: "size-4", lg: "size-5" } as const

/** Display-only rating: five stars rounded to whole, the number (one decimal), optional count. No reviews shows empty stars and the empty label, never 0.0. */
export function RatingStars({ value, count, size = "md", emptyLabel = "No reviews yet", ariaLabel, className }: { value: number | null | undefined; count?: number; size?: keyof typeof SIZE; emptyLabel?: string; ariaLabel?: string; className?: string }) {
  const none = value == null || (typeof count === "number" && count === 0)
  const rounded = none ? 0 : Math.min(5, Math.max(0, Math.round(value as number)))
  const label = ariaLabel ?? (none ? emptyLabel : `${(value as number).toFixed(1)} out of 5${typeof count === "number" ? `, ${count} reviews` : ""}`)
  return (
    <span role="img" aria-label={label} className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <span className="inline-flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className={cn(SIZE[size], n <= rounded ? "fill-warning-text text-warning-text" : "text-hairline")} />
        ))}
      </span>
      {none ? (
        <span className="text-muted">{emptyLabel}</span>
      ) : (
        <>
          <span className="font-semibold tabular-nums text-ink">{(value as number).toFixed(1)}</span>
          {typeof count === "number" ? <span className="text-muted">({count})</span> : null}
        </>
      )}
    </span>
  )
}
