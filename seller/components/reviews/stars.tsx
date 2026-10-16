import { Star } from "lucide-react"
import { cn } from "@ciuna/ui-web"
import { useT } from "@/lib/i18n"

/** Filled stars in the brand's readable orange. The group has one label ("4 out of 5"); the icons are decoration. */
export function Stars({ value, className, size = "size-4" }: { value: number; className?: string; size?: string }) {
  const { t } = useT()
  const rounded = Math.max(0, Math.min(5, Math.round(value)))
  return (
    <span role="img" aria-label={t("reviews.stars", { n: rounded })} className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} aria-hidden className={cn(size, i <= rounded ? "fill-current text-primary-text" : "text-hairline")} />
      ))}
    </span>
  )
}
