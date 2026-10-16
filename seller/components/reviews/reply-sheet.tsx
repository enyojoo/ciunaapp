"use client"
import * as React from "react"
import { Banner, Button, Field, Sheet, Textarea, useToast } from "@ciuna/ui-web"
import { api, ApiError } from "@/lib/api"
import { invalidate } from "@/lib/query"
import { useErrorText, useT } from "@/lib/i18n"
import { MAX_REPLY, replyProblem, type SellerReview } from "./logic"

export function ReplySheet({ review, onClose, onDone }: { review: SellerReview | null; onClose: () => void; onDone: () => void }) {
  const { t } = useT()
  const errText = useErrorText()
  const toast = useToast()
  const [text, setText] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (review) { setText(review.reply ?? ""); setError(null) }
  }, [review])

  const problem = replyProblem(text)
  const left = MAX_REPLY - text.length

  async function submit() {
    if (!review || problem) return
    setBusy(true); setError(null)
    try {
      await api(`/api/merchant/reviews/${encodeURIComponent(review.id)}/reply`, { method: "POST", json: { reply: text.trim() } })
      invalidate("reviews")
      toast.show(t("reviews.reply.sent"))
      onDone()
      onClose()
    } catch (e) {
      setError(errText(e instanceof ApiError ? e.code : undefined))
    } finally { setBusy(false) }
  }

  return (
    <Sheet
      open={Boolean(review)}
      onOpenChange={(o) => { if (!o) onClose() }}
      title={review?.reply ? t("reviews.editReply") : t("reviews.reply")}
      description={t("reviews.reply.public")}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>{t("action.cancel")}</Button>
          <Button onClick={submit} busy={busy} disabled={Boolean(problem)}>{review?.reply ? t("action.save") : t("reviews.reply.send")}</Button>
        </>
      }
    >
      {review ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-neutral-surface p-3.5 text-[15px] text-ink">
            {review.body || <span className="text-muted">{t("reviews.noText")}</span>}
          </div>
          <Field label={t("reviews.reply.label")} hint={review.reply ? t("reviews.reply.editWindow") : undefined}>
            <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} maxLength={MAX_REPLY + 100} />
          </Field>
          <p className={left < 0 ? "-mt-2 text-sm font-semibold text-destructive-text" : "-mt-2 text-sm text-muted"} aria-live="polite">{t("reviews.reply.counter", { used: text.length, max: MAX_REPLY })}</p>
          {text.length > MAX_REPLY ? <Banner tone="destructive" title={errText("REPLY_TOO_LONG")} /> : null}
          {error ? <Banner tone="destructive" title={error} /> : null}
        </div>
      ) : null}
    </Sheet>
  )
}
