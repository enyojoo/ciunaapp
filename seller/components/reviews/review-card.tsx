"use client"
import { format } from "date-fns"
import { Clock, Lock } from "lucide-react"
import { Button, Card } from "@ciuna/ui-web"
import { useT } from "@/lib/i18n"
import { dateLocale } from "@/components/orders/format"
import { Stars } from "./stars"
import type { SellerReview } from "./logic"

export function ReviewCard({ review, canReply, onReply }: { review: SellerReview; canReply: boolean; onReply: (r: SellerReview) => void }) {
  const { t, locale } = useT()
  const date = format(new Date(review.created_at), "PP", { locale: dateLocale(locale) })
  return (
    <Card className="flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <Stars value={review.rating} />
        <p className="text-sm text-muted">
          <span className="font-semibold text-ink">{review.customer_first_name || t("reviews.customer")}</span> · {date}
        </p>
      </div>
      {review.body ? <p className="whitespace-pre-line break-words text-[15px] text-ink">{review.body}</p> : <p className="text-sm text-muted">{t("reviews.noText")}</p>}
      {review.reply ? (
        <div className="rounded-2xl bg-neutral-surface p-3.5">
          <p className="text-sm font-semibold text-ink">{t("reviews.yourReply")}</p>
          <p className="mt-1 whitespace-pre-line break-words text-[15px] text-ink">{review.reply}</p>
          <EditWindow review={review} />
        </div>
      ) : null}
      {canReply && (!review.reply || review.reply_editable) ? (
        <div>
          <Button variant="secondary" size="sm" onClick={() => onReply(review)}>{review.reply ? t("reviews.editReply") : t("reviews.reply")}</Button>
        </div>
      ) : null}
    </Card>
  )
}

/** Names the edit window under a posted reply: hours left while editable, a locked note after. */
function EditWindow({ review }: { review: SellerReview }) {
  const { t } = useT()
  if (review.reply_editable) {
    const until = review.reply_editable_until ? new Date(review.reply_editable_until).getTime() : null
    const hours = until ? Math.max(1, Math.ceil((until - Date.now()) / 3_600_000)) : null
    return <p className="mt-2 flex items-center gap-1.5 text-sm text-muted"><Clock className="size-4 shrink-0" aria-hidden />{hours ? t("reviews.editLeft", { hours }) : t("reviews.reply.editWindow")}</p>
  }
  return <p className="mt-2 flex items-center gap-1.5 text-sm text-muted"><Lock className="size-4 shrink-0" aria-hidden />{t("reviews.locked")}</p>
}
