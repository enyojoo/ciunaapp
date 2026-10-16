"use client"
import { Card } from "@ciuna/ui-web"
import { useT } from "@/lib/i18n"
import { Stars } from "./stars"
import { barPercent, type ReviewSummary } from "./logic"

export function SummaryCard({ summary }: { summary: ReviewSummary }) {
  const { t } = useT()
  return (
    <Card className="mb-4 grid gap-5 p-4 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8 sm:p-5 lg:grid-cols-1 lg:gap-5">
      <div>
        <p className="text-4xl font-semibold tabular-nums text-ink">{summary.avg === null ? "-" : summary.avg.toFixed(1)}</p>
        {summary.avg !== null ? <Stars value={summary.avg} size="size-5" className="mt-1" /> : null}
        <p className="mt-1 text-sm text-muted">{summary.count === 1 ? t("reviews.count.one") : t("reviews.count", { count: summary.count })}</p>
      </div>
      <ul className="space-y-1.5" aria-label={t("reviews.distribution")}>
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const n = summary.distribution[String(star) as keyof typeof summary.distribution]
          return (
            <li key={star} className="flex items-center gap-3 text-sm">
              <span className="w-12 shrink-0 tabular-nums text-muted">{t("reviews.starsShort", { n: star })}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-surface" aria-hidden>
                <span className="block h-full rounded-full bg-primary" style={{ width: `${barPercent(n, summary.count)}%` }} />
              </span>
              <span className="w-8 shrink-0 text-right tabular-nums text-ink">{n}</span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
