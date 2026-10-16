"use client"
import * as React from "react"
import { Star } from "lucide-react"
import { Banner, Button, EmptyState, PageHeader, Skeleton, Tabs } from "@ciuna/ui-web"
import { SellerNoAccess } from "@/components/no-access"
import { api } from "@/lib/api"
import { useQuery } from "@/lib/query"
import { useSeller } from "@/lib/session"
import { useErrorText, useT } from "@/lib/i18n"
import { PAGE, type ReviewTab, type ReviewsResponse, type SellerReview } from "@/components/reviews/logic"
import { ReplySheet } from "@/components/reviews/reply-sheet"
import { ReviewCard } from "@/components/reviews/review-card"
import { SummaryCard } from "@/components/reviews/summary-card"

export default function ReviewsPage() {
  const { t } = useT()
  const { can } = useSeller()
  if (!can("orders")) {
    return (
      <SellerNoAccess pageTitle={t("reviews.title")} titleKey="reviews.noAccess.title" bodyKey="reviews.noAccess.body" />
    )
  }
  return <ReviewsList />
}

function ReviewsList() {
  const { t } = useT()
  const errText = useErrorText()
  const [tab, setTab] = React.useState<ReviewTab>("all")
  const [limit, setLimit] = React.useState(PAGE)
  const [replying, setReplying] = React.useState<SellerReview | null>(null)
  const { data, error, loading, reload } = useQuery<ReviewsResponse>(`reviews:${tab}:${limit}`, () => api<ReviewsResponse>(`/api/merchant/reviews?status=${tab}&limit=${limit}`), { refreshMs: 60_000 })

  const tabs = [
    { value: "all" as const, label: t("reviews.tab.all") },
    { value: "needs_reply" as const, label: t("reviews.tab.needsReply"), count: data?.needs_reply },
  ]
  const retry = <Button size="sm" variant="secondary" onClick={() => void reload()}>{t("action.retry")}</Button>

  return (
    <>
      <PageHeader title={t("reviews.title")} description={t("reviews.subtitle")} />
      {data ? <SummaryCard summary={data.summary} /> : null}
      <Tabs value={tab} onChange={(v) => { setTab(v); setLimit(PAGE) }} items={tabs} className="mb-4" />
      <div role="tabpanel" aria-busy={loading}>
        {loading && !data ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-32" />)}</div>
        ) : error && !data ? (
          <Banner tone="destructive" title={errText(error.code)} action={retry} />
        ) : data && data.reviews.length === 0 ? (
          tab === "needs_reply" && data.summary.count > 0
            ? <EmptyState icon={<Star />} title={t("reviews.empty.caughtUp.title")} description={t("reviews.empty.caughtUp.body")} />
            : <EmptyState icon={<Star />} title={t("reviews.empty.title")} description={t("reviews.empty.body")} />
        ) : (
          <>
            {error ? <div className="mb-3"><Banner tone="warning" title={errText(error.code)} action={retry} /></div> : null}
            <ul className="space-y-3">
              {data?.reviews.map((r) => <li key={r.id}><ReviewCard review={r} canReply onReply={setReplying} /></li>)}
            </ul>
            {data && data.total > data.reviews.length ? (
              <div className="mt-4 flex justify-center">
                <Button variant="secondary" onClick={() => setLimit((l) => l + PAGE)}>{t("reviews.more")}</Button>
              </div>
            ) : null}
          </>
        )}
      </div>
      <ReplySheet review={replying} onClose={() => setReplying(null)} onDone={() => void reload()} />
    </>
  )
}
