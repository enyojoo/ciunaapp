import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { starsText } from "./review-lib"

export function RatingStars({ value, className }: { value: number; className?: string }) {
  return (
    <span role="img" aria-label={starsText(value)} className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} aria-hidden className={cn("h-3.5 w-3.5", i <= value ? "fill-current text-primary-text" : "text-muted-foreground/40")} />
      ))}
    </span>
  )
}
